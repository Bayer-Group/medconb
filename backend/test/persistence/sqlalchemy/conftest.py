import psycopg2
import pytest
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy import create_engine

from medconb.persistence.sqlalchemy import create_sessionmaker


@pytest.fixture
def session(sessionmaker):
    sm, on_startup = sessionmaker
    with sm() as session:
        yield session


@pytest.fixture
def sessionmaker():
    conn = psycopg2.connect("postgresql://postgres:password@localhost/")
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    with conn.cursor() as curs:
        curs.execute("DROP DATABASE IF EXISTS test")
        curs.execute("CREATE DATABASE test TEMPLATE test_template")
    conn.close()

    engine_medconb = create_engine(
        url="postgresql://postgres:password@localhost/test",
        future=True,
        echo=False,
    )
    engine_ontology = create_engine(
        url="postgresql://postgres:password@localhost/ontologies",
        future=True,
        echo=False,
    )

    yield create_sessionmaker(engine_medconb, engine_ontology)

    engine_medconb.dispose()
