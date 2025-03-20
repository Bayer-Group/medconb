from sqlalchemy import create_mock_engine

from medconb.persistence.sqlalchemy.orm import mapper_registry
from medconb.persistence.sqlalchemy.ontology_orm import (
    mapper_registry as mapper_registry_ontology,
)


def metadata_dump(sql, *multiparams, **params):
    # print or write to log or file etc
    print(sql.compile(dialect=engine.dialect))


engine = create_mock_engine("postgresql://", metadata_dump)

mapper_registry.metadata.create_all(engine, checkfirst=False)  # type: ignore
mapper_registry_ontology.metadata.create_all(engine, checkfirst=False)  # type: ignore
