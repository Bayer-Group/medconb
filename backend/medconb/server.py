import os
from typing import Callable, Sequence

from ariadne.asgi import GraphQL
from ariadne.asgi.handlers import GraphQLHTTPHandler, GraphQLWSHandler
from starlette.applications import Starlette
from starlette.authentication import requires
from starlette.exceptions import HTTPException
from starlette.middleware import Middleware
from starlette.middleware.authentication import AuthenticationMiddleware
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.routing import Mount, Route
from starlette.staticfiles import StaticFiles
from starlette.types import ASGIApp
from starlette_context import plugins
from starlette_context.middleware import RawContextMiddleware

from .graphql import main as graphql
from .log import time_me
from .middleware import AuthBackend, DBSessionMiddleware
from .types import sessionmaker


def http_exception(request: Request, exc: Exception) -> Response:
    assert isinstance(exc, HTTPException)
    return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)


def status(version_suffix: str | None) -> Callable:
    """
    This create a Route that serves as livelihood probe.
    Additionally it returns the version number of the backend service.
    The version number is fetched from the environment variable
    `MEDCONB_VERSION` and suffixed with `version_suffix`.

    The versioning serves the purpose that the frontend can force a
    flush of the cache after a new version was deployed which might
    bring incompatibilities.
    The version is planned to be set to the git sha hash.
    Additionally, the version suffix can be used to force a flush of the
    local data on the client when e.g. the ontologies were updated but
    the backend version stayed the same.
    """
    version = os.getenv("MEDCONB_VERSION", "NO_VERSION")

    async def status_(_):
        version_string = f"{version}-{version_suffix}" if version_suffix else version
        return JSONResponse({"status": "ok", "version": version_string})

    return status_


class SecureGraphQLHTTPHandler(GraphQLHTTPHandler):
    """
    GQLHTTPHandler changes the ariadne GraphQLHTTPHandler class such
    that requests are wrapped by the auth middleware, except the graphql
    playground.
    """

    @time_me(__name__)
    @requires("authenticated")
    async def graphql_http_server(self, request: Request) -> Response:
        return await super().graphql_http_server(request)


class SecureGraphQLWSHandler(GraphQLWSHandler):
    """
    GQLWSHandler changes the ariadne GraphQLWSHandler class such
    that requests are wrapped by the auth middleware.
    """

    @requires("authenticated")
    async def handle_websocket_message(self, websocket, message, operations):
        return await super().handle_websocket_message(websocket, message, operations)


class SecureStaticFiles(StaticFiles):
    # Files that are allowed to be served without authentication
    __PUBLIC_FILES = ["/manifest.json"]

    async def __call__(self, scope, receive, send) -> None:
        assert scope["type"] == "http"

        if scope["path"] in self.__PUBLIC_FILES:
            await super().__call__(scope, receive, send)
            return

        if "auth" not in scope:
            raise HTTPException(status_code=401)

        if "authenticated" not in scope.get("auth").scopes:
            raise HTTPException(status_code=403)

        await super().__call__(scope, receive, send)


def on_auth_error(request: Request, exc: Exception):
    return JSONResponse({"error": str(exc)}, status_code=401)


def create_CORSMiddleware(config) -> Middleware:
    allow_origins = config["cors"]["origins"].get(list)

    options = {
        "allow_origins": allow_origins,
        "allow_methods": ["POST", "GET", "HEAD", "OPTIONS"],
        "allow_headers": [
            "access-control-allow-origin",
            "authorization",
            "content-type",
        ],
    }

    return Middleware(CORSMiddleware, **options)


def create_app(
    sessionmaker: sessionmaker, config, on_startup=Sequence[Callable]
) -> ASGIApp:
    debug_ = config["debug"].get(False)
    assets_directory = config["assetsDir"].get("assets")

    return Starlette(
        middleware=[
            Middleware(DBSessionMiddleware, sessionmaker=sessionmaker),
            create_CORSMiddleware(config),
            Middleware(
                AuthenticationMiddleware,
                backend=AuthBackend(config["auth"], sessionmaker()),
                on_error=on_auth_error,
            ),
            Middleware(
                RawContextMiddleware,
                plugins=(plugins.RequestIdPlugin(), plugins.CorrelationIdPlugin()),
            ),
        ],
        on_startup=on_startup,
        exception_handlers={
            HTTPException: http_exception,
            # errors.MissingClaimError: http_exception,
        },
        routes=[
            Route("/", status(config["versionSuffix"].get(None))),
            Mount(
                "/graphql",
                GraphQL(
                    graphql.schema,
                    http_handler=SecureGraphQLHTTPHandler(),
                    websocket_handler=SecureGraphQLWSHandler(),
                    debug=debug_,
                ),
            ),
            Mount(
                "/assets",
                app=SecureStaticFiles(directory=assets_directory),
                name="assets",
            ),
        ],
        debug=debug_,
    )
