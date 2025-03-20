"""
This script aims to validate the data in the database after it has been
upgraded to version 14.
It will take care of:
 * Assuring that required properties are present
 * Assuring that required properties are set on the objects and setting
   them if not.
"""

import os
from typing import TYPE_CHECKING, cast

from sqlalchemy import select

import medconb.domain as d

if TYPE_CHECKING:
    from sqlalchemy.orm import Session as SQLSession

    from medconb.types import Session


def main(session: "SQLSession | Session"):
    assert_required_properties(session)
    assert_required_properties_set_on_collections(session)
    assert_required_properties_set_on_phenotypes(session)


def assert_required_properties(session: "Session"):
    """
    We need to have the following system properties present for all
    objects:
     * Created
     * Last Edited
     * Created By
     * Last Edited By
    """
    required_props = ["Created", "Last Edited", "Created By", "Last Edited By"]

    properties = session.property_repository.get_all(class_=d.PropertyClass.Collection)
    assert len([p for p in properties if p.name in required_props]) == len(
        required_props
    )

    properties = session.property_repository.get_all(class_=d.PropertyClass.Phenotype)
    assert len([p for p in properties if p.name in required_props]) == len(
        required_props
    )


def assert_required_properties_set_on_collections(session: "Session"):
    """
    Set a default value for system properties on the collections that
    don't have them.
    """
    all_props = session.property_repository.get_all(class_=d.PropertyClass.Collection)
    all_props_by_name = {p.name: p for p in all_props}

    required_props = {
        "Created": lambda _: "0.0",
        "Last Edited": lambda _: "0.0",
        "Created By": lambda o: str(o.owner_id),
        "Last Edited By": lambda o: str(o.owner_id),
    }

    collections = cast(list[d.Collection], session.scalars(select(d.Collection)).all())

    print(f"Processing {len(collections)} collections")

    for collection in collections:
        prop_bag = collection.properties
        for required_property, defaulter in required_props.items():
            if required_property not in prop_bag:
                prop_bag[required_property] = (
                    all_props_by_name[required_property].id,
                    defaulter(collection),
                )

        # make sure all required properties are set
        bags_prop_ids = [x[0] for x in prop_bag.values() if x[0] is not None]
        for prop in filter(lambda p: p.required, all_props):
            if prop.id in bags_prop_ids:
                continue
            prop_bag[prop.name] = (prop.id, "")


def assert_required_properties_set_on_phenotypes(session: "Session"):
    """
    Set a default value for system properties on the phenotypes that
    don't have them.
    """
    all_props = session.property_repository.get_all(class_=d.PropertyClass.Phenotype)
    all_props_by_name = {p.name: p for p in all_props}

    required_props = {
        "Created": lambda o: o.properties.get("Created", [0, "0.0"])[1],
        "Last Edited": lambda o: o.properties.get("Last Edited", [0, "0.0"])[1],
        "Created By": lambda o: str(o.owner_id),
        "Last Edited By": lambda o: str(o.owner_id),
    }

    phenotypes = cast(list[d.Phenotype], session.scalars(select(d.Phenotype)).all())

    print(f"Processing {len(phenotypes)} phenotypes")

    for phenotype in phenotypes:
        prop_bag = phenotype.properties
        for required_property, defaulter in required_props.items():
            if required_property not in prop_bag:
                collection = session.collection_repository.get(phenotype.container.id)
                prop_bag[required_property] = (
                    all_props_by_name[required_property].id,
                    defaulter(collection),
                )

        # make sure all required properties are set
        bags_prop_ids = [x[0] for x in prop_bag.values() if x[0] is not None]
        for prop in filter(lambda p: p.required, all_props):
            if prop.id in bags_prop_ids:
                continue
            prop_bag[prop.name] = (prop.id, "")


def sessionmaker():
    from sqlalchemy import create_engine

    from medconb.persistence.sqlalchemy import create_sessionmaker

    conn_str = os.getenv("DB_CONN_STR", "postgresql://postgres:password@localhost/")
    conn_db = os.getenv("DB_NAME", "medconb")

    engine_medconb = create_engine(url=f"{conn_str}{conn_db}", future=True, echo=False)
    engine_ontology = create_engine(
        url=f"{conn_str}ontologies", future=True, echo=False
    )

    sm, startup_hooks = create_sessionmaker(engine_medconb, engine_ontology)

    for startup_hook in startup_hooks:
        startup_hook()

    yield sm

    engine_medconb.dispose()
    engine_ontology.dispose()


if __name__ == "__main__":
    sm = next(sessionmaker())

    with sm() as session:
        main(session)
        session.commit()
