"""
This script imports new ontology data into the database
and translates all existing codelists to the new ontology.

As input it takes the tables code_new and ontology_new,
as converted from the target table from the UMLS pipeline.
This data has not correctly ordered IDs.

It writes to the tables code and ontology.

It updates all existing changesets to the new ids.
"""

import os
from collections import defaultdict
from pathlib import Path
from typing import cast

from sqlalchemy import (
    Column,
    Integer,
    String,
    Table,
    Values,
    column,
    create_engine,
    func,
    insert,
    literal,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, array_agg
from sqlalchemy.future import select
from sqlalchemy.orm import Session
from sqlalchemy.orm import Session as SQLSession
from sqlalchemy.schema import CreateTable, DropTable

import medconb.domain as d
from medconb.persistence.sqlalchemy import create_sessionmaker
from medconb.persistence.sqlalchemy.ontology_orm import code as code_table
from medconb.persistence.sqlalchemy.ontology_orm import mapper_registry
from medconb.persistence.sqlalchemy.ontology_orm import ontology as ontology_table
from medconb.persistence.sqlalchemy.orm import changeset as changeset_table

# This sql code creates the input tables for this script from the target
# table from the UMLS pipeline.
"""
DROP TABLE IF EXISTS "code_new";
DROP TABLE IF EXISTS "ontology_new";

CREATE TABLE "code_new" AS (
    SELECT
        "id", "code", "vocabulary" AS "ontology_id", "label" AS "description",
        ARRAY_APPEND("path", "id") AS "path", "child_ids" AS "children_ids"
    FROM target
);

UPDATE "code_new" SET "ontology_id" = 'ICD-10-CM' WHERE "ontology_id" = 'ICD10CM';
UPDATE "code_new" SET "ontology_id" = 'ICD-10-PCS' WHERE "ontology_id" = 'ICD10PCS';
UPDATE "code_new" SET "ontology_id" = 'ICD-9-CM' WHERE "ontology_id" = 'ICD9CM';
UPDATE "code_new" SET "ontology_id" = 'ICD-9-PCS' WHERE "ontology_id" = 'ICD9PCS';

CREATE TABLE "ontology_new" AS (
    SELECT "ontology_id" as "id", ARRAY_AGG("r" ORDER BY "r") AS "root_code_ids"
    FROM (
        SELECT DISTINCT "ontology_id", path[1] "r"
        FROM "code_new"
    ) "c"
    GROUP BY "ontology_id"
);

"""


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
    Column("ontology_id_old", String),
    Column("id", Integer),
    Column("id_new", Integer),
    Column("ontology_id", String),
    Column("path", ARRAY(Integer)),
    Column("children_ids", ARRAY(Integer)),
    Column("last_descendant_id", Integer),
)


conn_str = os.getenv("CONN_STR", "postgresql://postgres:password@localhost/")
db_name = os.getenv("DB_NAME", "medconb")

engine_medconb = create_engine(
    url=os.path.join(conn_str, db_name), future=True, echo=False
)

engine_ontology = create_engine(
    url=os.path.join(conn_str, "ontologies"), future=True, echo=False
)

ontology_map: dict[str, list[str]] = {
    # old ontology: [new ontologies]
    "ICD-10-CM": ["ICD-10-CM"],
    "ICD-10-PCS": ["ICD-10-PCS"],
    "ICD-9-CM": ["ICD-9-CM", "ICD-9-PCS"],
    "CPT": ["CPT"],
    "HCPCS": ["HCPCS"],
}


def get_file_as_list(file_name: str) -> list[str]:
    return (
        Path(__file__)
        .parent.resolve()
        .joinpath(file_name)
        .read_text()
        .strip()
        .split("\n")
    )


cpt_modifier_codes = get_file_as_list("cpt_modifier_codes.txt")
cpt_pos_codes = get_file_as_list("cpt_pos_codes.txt")

# Codes that are known to be missing in the new ontology.
# As long as they are not referenced in the codelists, we will remove them.
# For HCPCS this is a temporary solution until the ontology pipeline
# historizes HCPCS instead of relying on the "self"-reported obsolete codes.
# For CPT this should only be necessary for the first migration when we still
# had "garbage" codes in the ontology.
codes_missing_in_new: dict[str, set] = {
    # old ontology: removed codes
    "CPT": set(cpt_modifier_codes) | set(cpt_pos_codes),
    "HCPCS": {
        "LEVEL 1: M0000-M1149",
        "LEVEL 2: C5271-C5278",
        "LEVEL 2: C8957-C9488",
        "LEVEL 2: K1001-K1027",
        "LEVEL 2: Q2004-Q2055",
        "LEVEL 2: Q4100-Q4255",
        "LEVEL 2: Q5101-Q5123",
        "LEVEL 3: A2001-A2010",
        "LEVEL 3: A4244-A4290",
        "LEVEL 3: A9500-A9700",
        "LEVEL 3: D1701-D1707",
        "LEVEL 3: D4210-D4285",
        "LEVEL 3: D6100-D6104",
        "LEVEL 3: D7510-D7560",
        "A2003",
        "M1072",
        "M1073",
        "M1074",
        "M1076",
        "M1075",
        "M1077",
        "M1078",
        "M1079",
        "M1080",
        "M1081",
        "M1082",
        "M1083",
        "M1084",
        "M1085",
        "M1086",
        "M1087",
        "M1088",
        "M1089",
        "M1094",
        "M1095",
        "M1096",
        "M1097",
        "M1098",
        "M1099",
        "M1100",
        "M1101",
        "M1102",
        "M1103",
        "M1104",
        "M1105",
    },
}

# codes that are allowed to be removed from the codelists
codes_allow_removal: dict[str, set] = {
    # old ontology: removable codes
    "ICD-10-CM": {
        # these are children-less hierarchical nodes
        "C00-C75",
        "C00-C96",
        "M00-M25",
        "M40-M54",
        "M60-M79",
        "M80-M94",
        "T07-T88",
        "T20-T32",
        "V00-X58",
        "V00-V99",
        "W00-X58",
        "Y62-Y84",
        # these hierarchical nodes got extended and thus are now
        # called differently. Nobody will miss them 🤞.
        "I10-I16",
        "J40-J47",
    },
    "ICD-10-PCS": {
        # removed branch, children found in DEPR.
        # Nobody will miss the hierarchical nodes 🤞.
        "XV",
    },
    "ICD-9-CM": {
        # removed for splitting into CM and PCS
        "00-99.99",
        "001-999.99",
    },
    "CPT": {
        # these are children-less hierarchical nodes
        "1005879",
        "1027823",
        # removed branch, children found in DEPR.
        # Nobody will miss the hierarchical nodes 🤞.
        "1009450",
        "1009456",
        "1013100",
        "1029725",
        "1029726",
        "1029727",
        "1029971",
        "1035200",
        "1013651",
        "1022199",
        "1014311",
        "1036200",
        "1027657",
        "1015004",
        "1036188",
        "1022289",
        "1027648",
        "1015028",
        "1021859",
        "1027649",
        "1022196",
        "1034888",
        "1015112",
        "1013760",
        "1021849",
        "1027639",
        "1015022",
        "1015002",
        "1013652",
        "1019311",
        "1027856",
        "1027640",
        "1027650",
        "1021861",
        "1036184",
        "1036178",
        "1029964",
        "1028560",
        "1029960",
        "1029967",
        "1014989",
        "1021854",
        "1014967",
        "1014969",
        "1034889",
        "1013796",
        "1007410",
        "1015006",
        "1015023",
        "1027656",
        "1013771",
        "1022299",
        "1036189",
        "1014310",
        "1022302",
        "1036196",
        "1022207",
        "1021177",
        "1008035",
        "1015038",
        "1036186",
        "1015003",
        "1036215",
        "1018548",
        "1018174",
        "1014972",
        "1036187",
        "1028559",
        "1014968",
        "1035952",
        "1022298",
        "1014998",
        "1029961",
        "1027643",
        "1021435",
        "1013766",
        "1015040",
        "1014993",
        "1036185",
        "1014963",
        "1036193",
        "1036179",
        "1014973",
        "1015036",
        "1014971",
        "1027655",
        "1027652",
        "1036191",
        "1022194",
        "1031062",
        "1035128",
        "1008038",
        "1036199",
        "1015008",
        "1008028",
        "1021863",
        "1029965",
        "1008025",
        "1010736",
        "1022205",
        "1006402",
        "1022197",
        "1019401",
        "1015035",
        "1003386",
        "1022195",
        "1027651",
        "1027645",
        "1014996",
        "1021860",
        "1013759",
        "1015042",
        "1015024",
        "1019310",
        "1027820",
        "1015045",
        "1015030",
        "1014960",
        "1027642",
        "1027653",
        "1003681",
        "1010844",
        "1022206",
        "1035389",
        "1036197",
        "1014961",
        "1015031",
        "1029969",
        "1029963",
        "1014997",
        "1028558",
        "1015001",
        "1014992",
        "1029680",
        "1029994",
        "1036180",
        "1008627",
        "1027646",
        "1022198",
        "1014988",
        "1018176",
        "1036190",
        "1015027",
        "1022212",
        "1013757",
        "1029970",
        "1013649",
        "1028561",
        "1014991",
        "1036181",
        "1013648",
        "1028554",
        "1008032",
        "1029995",
        "1022211",
        "1015041",
        "1036198",
        "1015005",
        "1036195",
        "1015046",
        "1036182",
        "1036194",
        "1022204",
        "1027822",
        "1022300",
        "1014964",
        "1027654",
        "1036183",
        "1014986",
        "1022210",
        "1014994",
        "1022278",
        "1022202",
        "1018512",
        "1022193",
        "1027644",
        "1020434",
        "1022203",
        "1022201",
        "1015011",
        "1014999",
        "1015007",
        "1006175",
        "1036528",
        "1029966",
        "1014962",
        "1036192",
        "1022301",
        "1028557",
        "1027647",
        "1027641",
        "1015029",
        "1013800",
        "1014966",
        "1014970",
        "1012906",
        "1022208",
        "1015009",
        "1019309",
        "1022200",
        "1011220",
        "1015043",
        "1022209",
        "1028555",
        "1028556",
        # hierarchical node was merged into parent.
        # Nobody will miss the hierarchical nodes 🤞.
        "1009453",
        "1018177",
        "1018497",
        "1029968",
    },
    "HCPCS": {
        # these hierarchical nodes got extended and thus are now
        # called differently. Nobody will miss them 🤞.
        "LEVEL 3: A4244-A4290",
        "LEVEL 3: A9500-A9700",
    },
}


def main():
    sm, _ = create_sessionmaker(engine_medconb, engine_ontology)

    with sm() as session:
        _main(session)


def exec_text(session: Session, sql: str):
    return exec(session, text(sql))


def exec(session: Session, o):
    return session.execute(o, bind_arguments={"bind": engine_ontology})


def _main(session: Session):  # noqa R901 - too complex
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

    remove_invalid_codes(session)

    assert_referenced_codes_exist_in_new_table(session)
    assert_all_old_codes_exist_in_new_table(session)

    values_data = [(o_old, o) for o_old, os in ontology_map.items() for o in os]
    ontology_map_query = select(
        Values(
            column("ontology_old", String), column("ontology_new", String), name="omap"
        ).data(values_data)
    ).subquery()

    new_codes_sq = (
        select(
            d.Code.id.label("id_old"),
            d.Code.ontology_id.label("ontology_id_old"),
            code_new_tbl.c.id,
            code_new_tbl.c.code,
            code_new_tbl.c.ontology_id,
            code_new_tbl.c.description,
            code_new_tbl.c.path,
            code_new_tbl.c.children_ids,
        )
        .join(
            ontology_map_query, ontology_map_query.c.ontology_old == d.Code.ontology_id
        )
        .join(
            code_new_tbl,
            (ontology_map_query.c.ontology_new == code_new_tbl.c.ontology_id)
            & (func.lower(d.Code.code) == func.lower(code_new_tbl.c.code)),
            full=True,
        )
        .where(code_new_tbl.c.id.is_not(None))
    ).subquery("new_codes")

    # build the adjacency matrix, extended by artificial root nodes,
    # so we can iterate through all ontologies in one go.
    adj_stmt = select(
        new_codes_sq.c.id_old,
        new_codes_sq.c.id,
        new_codes_sq.c.ontology_id_old,
        new_codes_sq.c.ontology_id,
        new_codes_sq.c.children_ids,
    ).union_all(
        # ontology root nodes
        select(
            literal(None).label("id_old"),
            -1 * func.row_number().over(order_by=ontology_new_tbl.c.id).label("id"),
            literal(None).label("ontology_id_old"),
            ontology_new_tbl.c.id.label("ontology_id"),
            ontology_new_tbl.c.root_code_ids.label("children_ids"),
        ),
        # overall root node with ontology root nodes as children
        select(
            literal(None).label("id_old"),
            literal(0).label("id"),
            literal(None).label("ontology_id_old"),
            literal(None).label("ontology_id"),
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

    print("Create mapping table ...")
    exec(session, insert(id_map_table).values(list(id_map.values())))

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

    # Finally, use the mapping table to translate all codesets
    print("Update codesets ...")
    cs_map_stmt = select(
        id_map_table.c.id_old, id_map_table.c.id_new, id_map_table.c.ontology_id
    ).where(id_map_table.c.id_old.is_not(None))
    cs_map = {r[0]: r[1:] for r in session.execute(cs_map_stmt).fetchall()}
    next_id = session.scalar(select(func.max(changeset_table.c.id))) + 1
    inserts = []

    for record in session.execute(select(d.Changeset, changeset_table)).fetchall():
        cs = cast(d.Changeset, record[0])
        if cs.ontology_id == "ICD-9-CM":
            code_ids_added_pcs = {
                c[0]
                for c in map(cs_map.__getitem__, cs.code_ids_added)
                if c[1] == "ICD-9-PCS"
            }
            code_ids_removed_pcs = {
                c[0]
                for c in map(cs_map.__getitem__, cs.code_ids_removed)
                if c[1] == "ICD-9-PCS"
            }
            code_ids_added_cm = {
                c[0]
                for c in map(cs_map.__getitem__, cs.code_ids_added)
                if c[1] == "ICD-9-CM"
            }
            code_ids_removed_cm = {
                c[0]
                for c in map(cs_map.__getitem__, cs.code_ids_removed)
                if c[1] == "ICD-9-CM"
            }

            assert code_ids_added_pcs | code_ids_added_cm == {
                c[0] for c in map(cs_map.__getitem__, cs.code_ids_added)
            }
            assert code_ids_removed_pcs | code_ids_removed_cm == {
                c[0] for c in map(cs_map.__getitem__, cs.code_ids_removed)
            }

            cs.code_ids_added = d.SetOfCodeIds(code_ids_added_cm)
            cs.code_ids_removed = d.SetOfCodeIds(code_ids_removed_cm)

            if (not code_ids_added_cm) and (not code_ids_removed_cm):
                session.delete(cs)

            if code_ids_added_pcs or code_ids_removed_pcs:
                inserts.append(
                    {
                        "id": next_id,
                        "commit_id": record[2],
                        "ontology_id": "ICD-9-PCS",
                        "code_ids_added": code_ids_added_pcs,
                        "code_ids_removed": code_ids_removed_pcs,
                    }
                )
                next_id += 1

            continue

        cs.code_ids_added = d.SetOfCodeIds(
            {c[0] for c in map(cs_map.__getitem__, cs.code_ids_added)}
        )
        cs.code_ids_removed = d.SetOfCodeIds(
            {c[0] for c in map(cs_map.__getitem__, cs.code_ids_removed)}
        )

    if inserts:
        session.execute(insert(changeset_table), inserts)

    session.commit()


def remove_invalid_codes(session: SQLSession):
    """
    Removes all codes that were flagged as invalid from the codelists.

    Flagged codes are stored in `codes_allow_removal`.

    They may be added because of a conflict between the old and new
    ontology data and verified to be able to be removed from existing
    codelists.
    """

    for ontology_id, codes in codes_allow_removal.items():
        stmt = select(d.Code.id).where(
            (d.Code.ontology_id == ontology_id) & func.upper(d.Code.code).in_(codes)
        )
        ids = set(session.scalars(stmt).fetchall())

        if not ids:
            continue

        print(f"Remove {len(ids)} codes from ontology {ontology_id} from codelists")

        changesets: list[d.Changeset] = session.scalars(
            select(d.Changeset, changeset_table)
        ).fetchall()

        for cs in changesets:
            if cs.ontology_id != ontology_id:
                continue

            cs.code_ids_added = d.SetOfCodeIds(set(cs.code_ids_added) - ids)
            cs.code_ids_removed = d.SetOfCodeIds(set(cs.code_ids_removed) - ids)


def assert_referenced_codes_exist_in_new_table(session: SQLSession):
    """
    collects all codes referenced in the changesets and makes sure
    that they are present in the new code table.

    1. collect all code ids used in Changesets
    2. get the corresponding codes in the old code table
    3. check if they are present in the new code table

    in that: distinguish between ontologies
    """
    changesets: list[d.Changeset] = session.scalars(
        select(d.Changeset, changeset_table)
    ).fetchall()

    referenced_code_ids_by_ontology: dict[str, set[int]] = defaultdict(set)
    for cs in changesets:
        referenced_code_ids_by_ontology[cs.ontology_id] |= set(cs.code_ids_added) | set(
            cs.code_ids_removed
        )

    for ontology_id, ids in referenced_code_ids_by_ontology.items():
        codes_stmt = select(func.upper(d.Code.code)).where(
            (d.Code.ontology_id == ontology_id) & d.Code.id.in_(ids)
        )
        codes = set(session.scalars(codes_stmt).fetchall())
        print(
            f"Used {len(codes)} codes from ontology {ontology_id}"
            # ":\n", codes
        )

        assert len(codes) == len(
            ids
        ), f" -> Not all {len(ids)} ids referenced are present in the code table"

        new_codes_stmt = select(func.upper(code_new_tbl.c.code)).where(
            code_new_tbl.c.ontology_id.in_(ontology_map[ontology_id])
            & func.upper(code_new_tbl.c.code).in_(codes)
        )
        new_codes = set(session.scalars(new_codes_stmt).fetchall())

        if len(new_codes) != len(codes):
            missing = codes - new_codes
            raise ValueError(
                f"{len(missing)} referenced codes are missing in the new code table:"
                f" {missing}"
            )

        print(" -> All codes are present in the new code table")


def assert_all_old_codes_exist_in_new_table(session: SQLSession):
    """
    checks if all codes in the old code table are present in the new
    code table.

    1. collect all codes in old table
    2. check if they are present in the new code table

    in that: distinguish between ontologies
    """
    ontology_ids = session.scalars(select(d.Code.ontology_id).distinct()).fetchall()
    print("Ontologies:", ontology_ids)

    for ontology_id in ontology_ids:
        codes_stmt = select(func.upper(d.Code.code)).where(
            (d.Code.ontology_id == ontology_id)
        )
        codes = set(session.scalars(codes_stmt).fetchall())
        print(
            f"Found {len(codes)} codes from ontology {ontology_id}"
            # ":\n", codes
        )

        codes -= codes_allow_removal.get(ontology_id, set())
        codes -= codes_missing_in_new.get(ontology_id, set())

        new_codes_stmt = select(func.upper(code_new_tbl.c.code)).where(
            code_new_tbl.c.ontology_id.in_(ontology_map[ontology_id])
            & func.upper(code_new_tbl.c.code).in_(codes)
        )
        new_codes = set(session.scalars(new_codes_stmt).fetchall())

        if len(new_codes) != len(codes):
            missing = codes - new_codes
            raise ValueError(
                f"{len(missing)} codes are missing in the new code table: {missing}"
            )

        print(" -> All codes are present in the new code table")


def dfs(adj_matrix, id_map, path, node) -> int:
    id_new = len(id_map) + 1
    path = list(path) + [id_new] if node > 0 else []
    id_map[node] = {
        "id_old": adj_matrix[node].id_old,
        "ontology_id_old": adj_matrix[node].ontology_id_old,
        "id": node,
        "id_new": id_new,
        "ontology_id": adj_matrix[node].ontology_id,
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
