from typing import Any

from sqlalchemy import Column, Integer, String, Table, UniqueConstraint, inspect
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import registry

import medconb.domain as d

mapper_registry = registry()


ontology = Table(
    "ontology",
    mapper_registry.metadata,
    Column("id", String, primary_key=True),
    Column("root_code_ids", ARRAY(Integer), nullable=False),
)


code = Table(
    "code",
    mapper_registry.metadata,
    Column("id", Integer, primary_key=True, autoincrement=False),
    Column("code", String, nullable=False),
    Column("ontology_id", String, nullable=False),
    Column("description", String, nullable=False),
    Column("path", ARRAY(Integer), nullable=False),
    Column("children_ids", ARRAY(Integer), nullable=False),
    Column("last_descendant_id", Integer, nullable=False),
    UniqueConstraint("ontology_id", "code"),
)


def start_mappers() -> list[Any]:
    mappers = []

    mapper = inspect(d.Ontology, False) or mapper_registry.map_imperatively(
        d.Ontology, ontology
    )
    mappers.append(mapper)

    mapper = inspect(d.Code, False) or mapper_registry.map_imperatively(d.Code, code)
    mappers.append(mapper)

    return mappers
