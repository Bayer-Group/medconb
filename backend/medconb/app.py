import contextlib
import threading
from typing import TYPE_CHECKING, Callable

import confuse  # type: ignore
import redis
from sqlalchemy import create_engine

from . import server
from .config import config
from .log import setup_logging
from .persistence.sqlalchemy import (
    create_sessionmaker as create_sqlalchemy_sessionmaker,
)

if TYPE_CHECKING:  # pragma: no cover
    from starlette.types import ASGIApp

    from .types import sessionmaker


def create_app() -> "ASGIApp":  # pragma: no cover
    setup_logging(config)
    sm, cache_warmup = _create_sessionmaker(config)
    lifespan = _create_lifespan(cache_warmup) if cache_warmup else None
    return server.create_app(sm, config, lifespan=lifespan)


def _create_sessionmaker(
    config,
) -> tuple["sessionmaker", Callable | None]:  # pragma: no cover
    db_type = config["database"]["type"].get()

    if db_type == "sqlalchemy":
        cache_client = _create_cache_client(config["cache"])
        return _create_sqlalchemy_sessionmaker(config["database"], cache_client)
    elif db_type == "inmemory":
        raise NotImplementedError("inmemory database type was deprecated")
    else:
        raise NotImplementedError(
            f"I don't know how to handle a database of type '{db_type}'."
        )


def _create_sqlalchemy_sessionmaker(
    db_config, cache_client
) -> tuple["sessionmaker", Callable | None]:  # pragma: no cover
    engine_medconb = create_engine(
        url=db_config["medconb"]["url"].get(str),
        future=True,
        echo=db_config["medconb"]["echo"].get(confuse.Optional(bool, default=False)),
        pool_pre_ping=True,
    )

    engine_ontology = create_engine(
        url=db_config["ontologies"]["url"].get(str),
        future=True,
        echo=db_config["ontologies"]["echo"].get(confuse.Optional(bool, default=False)),
        pool_pre_ping=True,
    )

    return create_sqlalchemy_sessionmaker(engine_medconb, engine_ontology, cache_client)


def _create_cache_client(cache_config) -> redis.Redis | None:  # pragma: no cover
    if cache_config["enabled"].get(bool):
        return redis.StrictRedis(host=cache_config["host"].get(str), port=6379, db=0)
    return None


def _create_lifespan(cache_warmup: Callable):
    @contextlib.asynccontextmanager
    async def _lifespan(app):
        warmup_thread = threading.Thread(target=cache_warmup)
        warmup_thread.start()
        yield
        warmup_thread.join()

    return _lifespan
