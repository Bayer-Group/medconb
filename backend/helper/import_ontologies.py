"""
This script imports new ontology data into the database.

As input it takes the tables code_new and ontology_new,
as converted from the target table from the UMLS pipeline.
This data has not correctly ordered IDs.

It writes to the tables code and ontology.

It does not change any data in the code sets.
"""

import os

from sqlalchemy import (
    Column,
    Integer,
    String,
    Table,
    create_engine,
    func,
    insert,
    literal,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, array_agg
from sqlalchemy.future import select
from sqlalchemy.orm import Session
from sqlalchemy.schema import CreateTable, DropTable

# from medconb.types import Session
import medconb.domain as d
from medconb.persistence.sqlalchemy import create_sessionmaker
from medconb.persistence.sqlalchemy.ontology_orm import code as code_table
from medconb.persistence.sqlalchemy.ontology_orm import mapper_registry
from medconb.persistence.sqlalchemy.ontology_orm import ontology as ontology_table

code_new_tbl = Table(
    "code_new",
    mapper_registry.metadata,
    Column("id", Integer, primary_key=True),
    Column("code", String, nullable=False),
    Column("ontology_id", String, nullable=False),
    Column("description", String),
    Column("path", ARRAY(Integer)),
    Column("children_ids", ARRAY(Integer)),
)

ontology_new_tbl = Table(
    "ontology_new",
    mapper_registry.metadata,
    Column("id", String, primary_key=True),
    Column("root_code_ids", ARRAY(Integer), nullable=False),
)

id_map_table = Table(
    "id_map",
    mapper_registry.metadata,
    Column("id_old", Integer),
    Column("id", Integer),
    Column("id_new", Integer),
    Column("path", ARRAY(Integer)),
    Column("children_ids", ARRAY(Integer)),
    Column("last_descendant_id", Integer),
)


conn_str = os.getenv("CONN_STR", "postgresql://postgres:password@localhost/")
db_name = os.getenv("DB_NAME", "medconb")

engine_ontology = create_engine(
    url=os.path.join(conn_str, "ontologies_new"), future=True, echo=False
)
engine_medconb = create_engine(
    url=os.path.join(conn_str, db_name), future=True, echo=False
)


def main():
    sm, _ = create_sessionmaker(engine_medconb, engine_ontology)

    with sm() as session:
        _main(session)


def exec_text(session: Session, sql: str):
    return exec(session, text(sql))


def exec(session: Session, o):
    return session.execute(o, bind_arguments={"bind": engine_ontology})


def _main(session: Session):
    session.bind_table(code_new_tbl, engine_ontology)
    session.bind_table(ontology_new_tbl, engine_ontology)
    session.bind_table(id_map_table, engine_ontology)

    exec_text(session, "LOCK TABLE code")
    exec_text(session, "LOCK TABLE code_new")
    exec_text(session, "LOCK TABLE ontology")
    exec_text(session, "LOCK TABLE ontology_new")

    exec_text(session, "DROP TABLE IF EXISTS code_bak")
    exec_text(session, "CREATE TABLE code_bak AS (SELECT * FROM code)")
    exec_text(session, "DROP TABLE IF EXISTS ontology_bak")
    exec_text(session, "CREATE TABLE ontology_bak AS (SELECT * FROM ontology)")

    exec(session, DropTable(id_map_table, if_exists=True))
    exec(session, CreateTable(id_map_table, if_not_exists=True))

    # the new_codes subquery contains all codes from the new table and a
    # mapping to their old IDs (if existing previously)
    new_codes_stmt = select(
        d.Code.id.label("id_old"),
        code_new_tbl.c.id.label("id"),
        code_new_tbl.c.code,
        code_new_tbl.c.ontology_id,
        code_new_tbl.c.description,
        code_new_tbl.c.path,
        code_new_tbl.c.children_ids,
    ).join(
        code_new_tbl,
        (d.Code.code == code_new_tbl.c.code)
        & (d.Code.ontology_id == code_new_tbl.c.ontology_id),
        full=True,
    )
    new_codes_sq = new_codes_stmt.subquery("new_codes")

    # # make sure that all old codes are represented in the new table
    # qa_stmt = select(text("count(*)")).where(new_codes_sq.c.id.is_(None))
    # res = session.execute(qa_stmt).scalar()
    # if res != 0:
    #     raise ValueError("Not all existing codes are present in the new code table")

    qa_stmt = select(text("count(*)")).where(new_codes_sq.c.id_old.is_(None))
    res = session.execute(qa_stmt).scalar()
    print(f"{res} new codes are added.")

    # build the adjacency matrix, extended by artificial root nodes,
    # so we can iterate through all ontologies in one go.
    adj_stmt = select(
        new_codes_sq.c.id_old, new_codes_sq.c.id, new_codes_sq.c.children_ids
    ).union_all(
        # ontology root nodes
        select(
            literal(None).label("id_old"),
            -1 * func.row_number().over(order_by=ontology_new_tbl.c.id).label("id"),
            ontology_new_tbl.c.root_code_ids.label("children_ids"),
        ),
        # overall root node with ontology root nodes as children
        select(
            literal(None).label("id_old"),
            literal(0).label("id"),
            array_agg(
                select(
                    (-1 * func.row_number().over(order_by=ontology_new_tbl.c.id)).label(
                        "id"
                    )
                )
                .subquery()
                .c.id
            ).label("children_ids"),
        ),
    )

    print("Get adjacency matrix ...")
    res_adj = exec(session, adj_stmt).fetchall()

    adj_matrix = {r[1]: r for r in res_adj}

    print("number of nodes:", len(adj_matrix))
    id_map = {}

    print("Start DFS ...")
    dfs(adj_matrix, id_map, [], 0)

    insert_id_map_stmt = insert(id_map_table)

    print("Create mapping table ...")
    exec(session, insert_id_map_stmt.values(list(id_map.values())))

    # build the new code table
    code_table_data_stmt = (
        select(
            id_map_table.c.id_new.label("id"),
            new_codes_sq.c.code,
            new_codes_sq.c.ontology_id,
            new_codes_sq.c.description,
            id_map_table.c.path,
            id_map_table.c.children_ids,
            id_map_table.c.last_descendant_id,
        )
        .join(id_map_table, new_codes_sq.c.id == id_map_table.c.id, full=True)
        .where(id_map_table.c.id > 0)
        .order_by(id_map_table.c.id_new)
    )

    insert_codes_stmt = insert(code_table).from_select(
        code_table.c, code_table_data_stmt
    )

    if code_table.c.keys() != code_table_data_stmt.selected_columns.keys():
        session.rollback()
        raise ValueError(
            "code tables are incompatible: ",
            code_table.c.keys(),
            code_table_data_stmt.selected_columns.keys(),
        )

    # build the corresponding ontology table
    ontology_table_data_stmt = select(
        code_table.c.ontology_id.label("id"),
        array_agg(text("DISTINCT path[1] ORDER BY path[1]")).label("root_code_ids"),
    ).group_by(code_table.c.ontology_id)

    if ontology_table.c.keys() != ontology_table_data_stmt.selected_columns.keys():
        session.rollback()
        raise ValueError("ontology tables are incompatible")

    insert_ontologies_stmt = insert(ontology_table).from_select(
        ontology_table.c, ontology_table_data_stmt
    )

    print("Store new code and ontology tables ...")
    exec(session, DropTable(code_table, if_exists=True))
    exec(session, CreateTable(code_table))
    exec(session, insert_codes_stmt)

    exec(session, DropTable(ontology_table, if_exists=True))
    exec(session, CreateTable(ontology_table))
    exec(session, insert_ontologies_stmt)

    session.commit()


def dfs(adj_matrix, id_map, path, node) -> int:
    id_new = len(id_map) + 1
    path = list(path) + [id_new] if node > 0 else []
    id_map[node] = {
        "id_old": adj_matrix[node].id_old,
        "id": node,
        "id_new": id_new,
        "path": path,
        "children_ids": [],
    }

    last_id = id_new
    for c in adj_matrix[node].children_ids:
        last_id = dfs(adj_matrix, id_map, path, c)

    id_map[node]["last_descendant_id"] = last_id

    id_map[node]["children_ids"] = list(
        map(lambda x: id_map[x]["id_new"], adj_matrix[node].children_ids)
    )

    return last_id


if __name__ == "__main__":
    main()
