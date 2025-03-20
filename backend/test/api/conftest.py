import pytest


@pytest.fixture
def client(sessionmaker):
    from starlette.testclient import TestClient

    from medconb import server
    from medconb.config import config

    config["debug"] = True
    config["assetsDir"] = "backend/assets"
    config["cors"]["origins"] = ["*"]
    config["auth"]["develop"]["token"] = "FOOBAR"
    config["auth"]["develop"]["user_id"] = "00000000-0000-0000-0001-000000000001"

    sm, on_startup = sessionmaker
    app = server.create_app(sm, config, on_startup=on_startup)

    return TestClient(app)


@pytest.fixture
def sessionmaker():
    import psycopg2
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
    from sqlalchemy import create_engine

    from medconb.persistence.sqlalchemy import create_sessionmaker

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
