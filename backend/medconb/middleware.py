import logging
import typing
from datetime import datetime
from operator import attrgetter
from typing import Optional, Protocol

import confuse  # type: ignore
import requests
from authlib.jose import JsonWebToken, JWTClaims, errors  # type: ignore
from pydantic import BaseModel
from starlette.authentication import (
    AuthCredentials,
    AuthenticationBackend,
    AuthenticationError,
)
from starlette.requests import HTTPConnection
from starlette.types import Receive, Scope, Send

from . import domain as d
from .graphql.types import (
    CodelistInput,
    CodesetInput,
    CreateCollectionRequestDto,
    ImportCodelistsRequestDto,
)
from .interactors import CreateCollection, ImportCodelists
from .types import Session, sessionmaker

# import only for typing
if typing.TYPE_CHECKING:
    from confuse import Configuration

logger = logging.getLogger(__name__)


class DBSessionMiddleware:
    def __init__(self, app, sessionmaker: sessionmaker):
        self.app = app
        self.sessionmaker = sessionmaker

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] not in ("http", "websocket"):  # pragma: no cover
            await self.app(scope, receive, send)
            return

        with self.sessionmaker() as s:
            scope["db_session"] = s
            await self.app(scope, receive, send)


class Authenticator(Protocol):  # pragma: no cover
    def __init__(self, config, session: Session): ...

    def authenticate(self, conn_session: Session, token: str) -> None: ...

    @property
    def error(self) -> Exception | None: ...

    @property
    def credentials(self) -> AuthCredentials | None: ...

    @property
    def user(self) -> d.User | None: ...


class AuthBackend(AuthenticationBackend):
    def __init__(self, config: "Configuration", session: Session):
        self.authenticators: list[Authenticator] = []

        if config["ad"].exists():
            logger.info("Authorization method 'ad' is enabled")
            self.authenticators.append(AzureADAuthenticator(config["ad"], session))

        if config["develop"].exists():
            logger.info("Authorization method 'develop' is enabled")
            self.authenticators.append(DevAuthenticator(config["develop"], session))

        if len(self.authenticators) == 0:
            raise Exception("No authentication method was defined.")

    async def authenticate(
        self, conn: HTTPConnection
    ) -> Optional[tuple[AuthCredentials, d.User]]:
        """
        authenticate is called for every request that is configured to
        be restricted.
        """
        auth = conn.headers.get("Authorization", None)
        session: Session = conn["db_session"]

        if auth is None:
            return None

        scheme, _, token = auth.partition(" ")
        if scheme.lower() != "bearer":
            return None

        for a in self.authenticators:
            a.authenticate(session, token)
            if not a.error:
                break

        successful_auths = filter(lambda a: a.user is not None, self.authenticators)

        try:
            authenticator = next(successful_auths)
            assert authenticator.credentials is not None
            assert authenticator.user is not None

            authenticator.user.last_contact = datetime.now()
            session.commit()

            return authenticator.credentials, authenticator.user
        except StopIteration:
            raise next(map(attrgetter("error"), self.authenticators))


class DevAuthenticator:
    def __init__(self, config, session: Session):
        self._configure_develop(config, session)
        self._error: Exception | None = None
        self._credentials: AuthCredentials | None = None
        self._user: d.User | None = None

    def _configure_develop(self, cfg, session: Session):
        self.dev_config_token = cfg["token"].get(str)

        with session:
            user_id = d.UserID(cfg["user_id"].get(str))
            if not session.user_repository.get(user_id):
                raise ValueError(f"Dev-User with id '{user_id}' does not exist")
            self.dev_config_user_id = user_id

    @property
    def error(self) -> Exception | None:
        if self._error is None and self._user is None:
            raise Exception("authenticate was not called")
        return self._error

    @property
    def credentials(self) -> AuthCredentials | None:
        if self._credentials is None and self._error is None:
            raise Exception("authenticate was not called")
        return self._credentials

    @property
    def user(self) -> d.User | None:
        if self._user is None and self._error is None:
            raise Exception("authenticate was not called")
        return self._user

    def authenticate(self, conn_session: Session, token: str):
        self._user = None
        self._credentials = None
        self._error = None

        if self.dev_config_token == token:
            user = conn_session.user_repository.get(self.dev_config_user_id)
            if not user:  # pragma: no cover - happens when user was deleted after init
                self._error = AuthenticationError("Dev user does not exist anymore")
                return
            user.set_authenticated(True)
            self._credentials = AuthCredentials(["authenticated"])
            self._user = user
        else:
            self._error = AuthenticationError("Invalid Bearer token")


class AzureADAuthenticator:

    class ClaimsConfig(BaseModel):
        name: str
        mapped_to: str

    def __init__(self, config: "Configuration", session: Session):
        template = confuse.Sequence({"name": str, "mapped_to": str})
        extra_claims = [self.ClaimsConfig(**c) for c in config["claims"].get(template)]

        self._aud = config["aud"].get(str)
        self._extra_claims = extra_claims
        self._tenant = config["tenant"].get(str)

        self._configure_ad()
        self.session = session
        self._error: Exception | None = None
        self._credentials: AuthCredentials | None = None
        self._user: d.User | None = None

    @staticmethod
    def __claim_options(tenant: str, aud: str):
        return {
            "iss": {
                "essential": True,
                "values": [
                    f"https://login.microsoftonline.com/{tenant}/v2.0",  # noqa
                    f"https://sts.windows.net/{tenant}/",
                ],
            },
            "aud": {
                "essential": True,
                "value": f"{aud}",
            },
            "exp": {"essential": True},
            "iat": {"essential": True},
        }

    def _configure_ad(self):
        self._claim_options = self.__claim_options(self._tenant, self._aud)
        self._claim_map = {}

        for claim in self._extra_claims:
            self._claim_options[claim.name] = {"essential": True}
            self._claim_map[claim.mapped_to] = claim.name

        if self._claim_map.keys() != {"external_id", "email", "name"}:
            raise ValueError(
                "There must be claims mapped to 'external_id' and 'name of the users"
            )

        keys_url = (
            f"https://login.microsoftonline.com/{self._tenant}/discovery/v2.0/keys"
        )
        self.keys = requests.get(keys_url).json()

    @property
    def error(self) -> Exception | None:
        if self._error is None and self._user is None:
            raise Exception("authenticate was not called")
        return self._error

    @property
    def credentials(self) -> AuthCredentials | None:
        if self._credentials is None and self._error is None:
            raise Exception("authenticate was not called")
        return self._credentials

    @property
    def user(self) -> d.User | None:
        if self._user is None and self._error is None:
            raise Exception("authenticate was not called")
        return self._user

    def authenticate(self, conn_session: Session, jwt: str):
        self._user = None
        self._credentials = None
        self._error = None

        try:
            claims = self._extract_claims(jwt)
            self._credentials = AuthCredentials(["authenticated"])
            self._user = self._load_user(conn_session, claims)
        except errors.DecodeError:
            print(f"Unable to decode Bearer Token: '{jwt}'")
            self._error = AuthenticationError("Unable to decode Bearer token")
        except (
            errors.InvalidClaimError,
            errors.MissingClaimError,
            errors.ExpiredTokenError,
        ) as e:
            print(f"Unable to decode Bearer fvfvfToken: '{e.description} :: {jwt}'")
            self._error = AuthenticationError(e.description)

    def _extract_claims(self, token) -> JWTClaims:
        """
        decodes and validates the jwt token, assuming RS256 algorithm; returns claims
        """
        jwt = JsonWebToken(["RS256"])

        for try_nr in range(3):
            try:
                claims = jwt.decode(
                    token,
                    key=self.keys,
                    claims_options=self._claim_options,
                )
                claims.validate()
                break
            except ValueError as e:
                if "Invalid JSON Web Key Set" in str(e):
                    logger.info(
                        "Recieved error 'Invalid JSON Web Key Set' on token decoding."
                        " Reloading keys from AD. (try %d/3)",
                        try_nr + 1,
                    )
                    self._configure_ad()
                else:
                    raise e

        return claims

    def _load_user(self, session: Session, claims) -> d.User:
        """
        based on the external ID stored in token claims, load the
        corresponding user from the DB into the scope.
        If the user does not exist yet in db, create them.
        """
        external_id = claims[self._claim_map["external_id"]]
        name = claims[self._claim_map["name"]]

        if not external_id or not name:
            raise AuthenticationError(
                "The following claims must be non-empty: "
                f'{self._claim_map["external_id"]}, {self._claim_map["email"]}, '
                f'{self._claim_map["name"]}'
            )

        user: Optional[d.User] = session.user_repository.getByExternalID(external_id)
        if user is None:
            session.user_repository.lock()

            # check if user was created before lock was acquired
            user = session.user_repository.getByExternalID(external_id)
            if user is not None:
                return user

            return self._create_new_user(session, external_id, name, claims)

        if name != user.name:
            user.name = name

        for claim in self._claim_map:
            if claim in ["external_id", "name"]:
                continue
            if (
                claim not in user.properties
                or user.properties[claim][1] != claims[self._claim_map[claim]]
            ):
                user.properties[claim] = (None, claims[self._claim_map[claim]])

        session.commit()

        return user

    def _create_new_user(
        self, session: Session, external_id: str, name: str, claims: dict
    ) -> d.User:
        properties = {}
        for claim in self._claim_map:
            if claim in ["external_id", "name"]:
                continue
            properties[claim] = (None, claims[self._claim_map[claim]])

        user = d.User(
            id=session.user_repository.new_id(),
            external_id=external_id,
            name=name,
            workspace=d.Workspace(id=session.user_repository.new_workspace_id()),
        )

        session.add(user)
        self._init_new_user(session, user)
        session.commit()

        return user

    def _init_new_user(self, session: Session, user: d.User):
        collection_1 = CreateCollection(session, user)(
            CreateCollectionRequestDto(
                name="Flieder [Sample]",
                item_type=d.ItemType.Codelist,
                description="Automatically generated example collection",
                properties=[],
                reference_id=None,
            )
        )
        collection_2 = CreateCollection(session, user)(
            CreateCollectionRequestDto(
                name="Pacific AF [Sample]",
                item_type=d.ItemType.Codelist,
                description="Automatically generated example collection",
                properties=[],
                reference_id=None,
            )
        )

        ImportCodelists(session, user)(
            ImportCodelistsRequestDto(
                filename="init.csv",
                container_id=collection_1.id,
                codelists=[
                    CodelistInput(
                        name="Angina",
                        codesets=[
                            CodesetInput(
                                ontology_id="ICD-10-CM",
                                codes=[
                                    # fmt: off
                                    "I20", "I20.0", "I20.1", "I20.8", "I20.9"
                                    # fmt: on
                                ],
                            ),
                            CodesetInput(
                                ontology_id="ICD-9-CM",
                                codes=[
                                    # fmt: off
                                    "411.1", "413.0", "413.1", "413.9"
                                    # fmt: on
                                ],
                            ),
                        ],
                    ),
                    CodelistInput(
                        name="Atherosclerosis",
                        codesets=[
                            CodesetInput(
                                ontology_id="ICD-10-CM",
                                codes=[
                                    # fmt: off
                                    "I70.0", "I70.1", "I70.209", "I70.219", "I70.229",
                                    "I70.25", "I70.269", "I70.299", "I70.399",
                                    "I70.499", "I70.599", "I70.8", "I70.90", "I70.91",
                                    "I70.92"
                                    # fmt: on
                                ],
                            ),
                            CodesetInput(
                                ontology_id="ICD-9-CM",
                                codes=[
                                    # fmt: off
                                    "440.0", "440.1", "440.20", "440.21", "440.22",
                                    "440.23", "440.24", "440.29", "440.30", "440.31",
                                    "440.32", "440.4", "440.8", "440.9"
                                    # fmt: on
                                ],
                            ),
                        ],
                    ),
                    CodelistInput(
                        name="Coronary Artery Disease",
                        codesets=[
                            CodesetInput(
                                ontology_id="ICD-10-CM",
                                codes=[
                                    # fmt: off
                                    "I21.01", "I21.02", "I21.09", "I21.11", "I21.19",
                                    "I21.21", "I21.29", "I25.10", "I25.110", "I25.111",
                                    "I25.118", "I25.119", "I25.3", "I25.41", "I25.42",
                                    "I25.5", "I25.6", "I25.700", "I25.701", "I25.708",
                                    "I25.709", "I25.710", "I25.711", "I25.718",
                                    "I25.719", "I25.720", "I25.721", "I25.728",
                                    "I25.729", "I25.730", "I25.731", "I25.738",
                                    "I25.739", "I25.750", "I25.751", "I25.758",
                                    "I25.759", "I25.760", "I25.761", "I25.768",
                                    "I25.769", "I25.790", "I25.791", "I25.798",
                                    "I25.799", "I25.810", "I25.811", "I25.812",
                                    "I25.82", "I25.83", "I25.84", "I25.89", "I25.9",
                                    "I20.1", "I20.8", "I20.9", "I20.0", "I24.0",
                                    "I24.1", "I24.8", "I21.3", "I21.4", "I22.0",
                                    "I22.1", "I22.2", "I22.8", "I22.9", "I23.0",
                                    "I23.1", "I23.2", "I23.3", "I23.4", "I23.5",
                                    "I23.6", "I23.7", "I23.8", "I25.2", "Z95.5",
                                    "Z98.61"
                                    # fmt: on
                                ],
                            ),
                            CodesetInput(
                                ontology_id="ICD-9-CM",
                                codes=[
                                    # fmt: off
                                    "413.0", "413.1", "413.9", "414.00", "414.01",
                                    "414.02", "414.03", "414.04", "414.05", "414.06",
                                    "414.07", "414.10", "414.11", "414.12", "414.19",
                                    "414.2", "414.3", "414.4", "414.8", "414.9",
                                    "410.0", "410.00", "410.01", "410.02", "410.1",
                                    "410.10", "410.11", "410.12", "410.2", "410.20",
                                    "410.21", "410.22", "410.3", "410.30", "410.31",
                                    "410.32", "410.4", "410.40", "410.41", "410.42",
                                    "410.5", "410.50", "410.51", "410.52", "410.6",
                                    "410.60", "410.61", "410.62", "410.7", "410.70",
                                    "410.71", "410.72", "410.8", "410.80", "410.81",
                                    "410.82", "410.9", "410.90", "410.91", "410.92",
                                    "411.0", "411.1", "411.8", "411.81", "411.89",
                                    "412", "V45.82"
                                    # fmt: on
                                ],
                            ),
                        ],
                    ),
                ],
            )
        )

        ImportCodelists(session, user)(
            ImportCodelistsRequestDto(
                filename="init.csv",
                container_id=collection_2.id,
                codelists=[
                    CodelistInput(
                        name="Coronary Artery Disease",
                        codesets=[
                            CodesetInput(
                                ontology_id="ICD-10-CM",
                                codes=[
                                    # fmt: off
                                    "I20.0", "I20.1", "I20.8", "I20.9", "I25.10",
                                    "I25.110", "I25.111", "I25.118", "I25.119",
                                    "I25.41", "I25.42", "I25.5", "I25.6", "I25.700",
                                    "I25.701", "I25.708", "I25.709", "I25.710",
                                    "I25.711", "I25.718", "I25.719", "I25.720",
                                    "I25.721", "I25.728", "I25.729", "I25.730",
                                    "I25.731", "I25.738", "I25.739", "I25.750",
                                    "I25.751", "I25.758", "I25.759", "I25.760",
                                    "I25.761", "I25.768", "I25.769", "I25.790",
                                    "I25.791", "I25.798", "I25.799", "I25.810",
                                    "I25.811", "I25.812", "I25.82", "I25.83", "I25.84",
                                    "I25.89", "I25.9", "Z95.5", "Z98.61", "I20",
                                    "I25.1", "I25.11", "I25.4", "I25.7", "I25.70",
                                    "I25.71", "I25.72", "I25.73", "I25.75", "I25.76",
                                    "I25.79", "I25.8", "I25.81"
                                    # fmt: on
                                ],
                            ),
                            CodesetInput(
                                ontology_id="ICD-9-CM",
                                codes=[
                                    # fmt: off
                                    "411.1", "411.8", "411.81", "411.89", "413",
                                    "413.1", "413.9", "414", "414.01", "414.02",
                                    "414.03", "414.04", "414.05", "414.06", "414.07",
                                    "414.1", "414.11", "414.12", "414.19", "414.2",
                                    "414.3", "414.4", "414.8", "414.9", "413", "414",
                                    "414", "414.1"
                                    # fmt: on
                                ],
                            ),
                        ],
                    )
                ],
            )
        )
