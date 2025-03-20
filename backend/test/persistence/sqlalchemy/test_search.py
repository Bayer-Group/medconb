from dataclasses import dataclass, field

import pytest
from plyse import GrammarFactory, QueryParser

import medconb.domain as d
from medconb.types import Session

from ...helper import _c_id, _cl_id, _p_id, _u_id


def create_Collection(**kwargs):
    return d.Collection(
        **dict(
            dict(
                item_type=d.ItemType.Phenotype,
                item_ids=[],
                shared_with=set(),
                _owner_id=None,
            ),
            **kwargs,
        )
    )


def create_Phenotype(**kwargs):
    return d.Phenotype(
        **dict(
            dict(
                id=_cl_id(42),
                name="Phenotype",
                medical_description="",
                operational_description="",
                container=d.ContainerSpec(
                    id=_c_id(1), type_=d.ContainerType.Collection
                ),
            ),
            **kwargs,
        )
    )


def create_Codelist(**kwargs):
    return d.Codelist(
        **dict(
            dict(
                id=_cl_id(42),
                name="CL",
                description="",
                commits=[],
                transient_commit=None,
                container=d.ContainerSpec(
                    id=_c_id(1), type_=d.ContainerType.Collection
                ),
                reference_id=None,
            ),
            **kwargs,
        )
    )


@dataclass
class CIn:
    id_: int
    name: str
    description: str
    type_: d.ItemType
    owner: int
    shared_with: list[int] = field(default_factory=list)


@dataclass
class PIn:
    id_: int
    name: str
    description: str
    c_id: int


@dataclass
class LIn:
    id_: int
    name: str
    description: str
    c_type: d.ContainerType
    c_id: int


class TestSearchObjects:
    @pytest.fixture(autouse=True)
    def filled_session(self, session):  # noqa: R901 - too complex
        users = {
            1: session.user_repository.get(_u_id(1)),
            2: session.user_repository.get(_u_id(2)),
        }

        for u in users.values():
            for c in list(u.workspace.collection_ids):
                session.collection_repository.get(c).shared_with = set()
                u.workspace.remove_collection(c)

        collection_data = [
            CIn(1, "Study A B", "Description A B", d.ItemType.Phenotype, 1),
            CIn(2, "Study B C", "Description B C", d.ItemType.Phenotype, 1),
            CIn(3, "Study C D", "Description C D", d.ItemType.Phenotype, 1, [2]),
            CIn(4, "Study D E", "Description D E", d.ItemType.Phenotype, 2),
            CIn(5, "Study E F", "Description E F", d.ItemType.Phenotype, 2),
            CIn(6, "Codes A", "Description A", d.ItemType.Codelist, 1, [2]),
            CIn(7, "Codes B", "Description B", d.ItemType.Codelist, 1),
            CIn(8, "Codes C", "Description C", d.ItemType.Codelist, 2),
        ]

        phenotype_data = [
            PIn(1, "Phenotype A", "Description A", 1),
            PIn(2, "Phenotype B", "Description B", 1),
            PIn(3, "Phenotype C", "Description C", 1),
            PIn(4, "Phenotype D", "Description D", 2),
            PIn(5, "Phenotype E", "Description E", 2),
            PIn(6, "Phenotype F", "Description F", 3),
            PIn(7, "Phenotype G", "Description G", 3),
            PIn(8, "Phenotype H", "Description H", 4),
            PIn(9, "Phenotype I", "Description I", 4),
            PIn(10, "Phenotype J", "Description J", 5),
            PIn(11, "Phenotype K", "Description K", 5),
        ]

        codelist_data = [
            LIn(1, "Codelist A", "Description A", d.ContainerType.Phenotype, 1),
            LIn(2, "Codelist B", "Description B", d.ContainerType.Phenotype, 2),
            LIn(3, "Codelist C", "Description C", d.ContainerType.Phenotype, 3),
            LIn(4, "Codelist D", "Description D", d.ContainerType.Phenotype, 4),
            LIn(5, "Codelist E", "Description E", d.ContainerType.Phenotype, 5),
            LIn(6, "Codelist F", "Description F", d.ContainerType.Phenotype, 6),
            LIn(7, "Codelist G", "Description G", d.ContainerType.Phenotype, 7),
            LIn(8, "Codelist H", "Description H", d.ContainerType.Phenotype, 8),
            LIn(9, "Codelist I", "Description I", d.ContainerType.Phenotype, 9),
            LIn(10, "Codelist J", "Description J", d.ContainerType.Phenotype, 10),
            LIn(11, "Codelist K", "Description K", d.ContainerType.Phenotype, 11),
            LIn(12, "Codelist L", "Description L", d.ContainerType.Collection, 6),
            LIn(13, "Codelist M", "Description M", d.ContainerType.Collection, 7),
            LIn(14, "Codelist N", "Description N", d.ContainerType.Collection, 8),
        ]

        collections = {}
        for data in collection_data:
            collections[data.id_] = create_Collection(
                id=_c_id(data.id_ + 0x10),
                name=data.name,
                description=data.description,
                item_type=data.type_,
                shared_with={users[i] for i in data.shared_with},
            )
            users[data.owner].workspace.add_collection(collections[data.id_].id)

        phenotypes = {}
        for data in phenotype_data:
            phenotypes[data.id_] = create_Phenotype(
                id=_p_id(data.id_ + 0x10),
                name=data.name,
                medical_description=data.description,
                container=d.ContainerSpec(
                    d.ContainerType.Collection, _c_id(data.c_id + 0x10)
                ),
            )
            collections[data.c_id].item_ids.append(phenotypes[data.id_].id)

        codelists = {}
        for data in codelist_data:
            codelists[data.id_] = create_Codelist(
                id=_cl_id(data.id_ + 0x10),
                name=data.name,
                description=data.description,
                container=d.ContainerSpec(data.c_type, _c_id(data.c_id + 0x10)),
            )
            match data.c_type:
                case d.ContainerType.Phenotype:
                    phenotypes[data.c_id].item_ids.append(codelists[data.id_].id)
                case d.ContainerType.Collection:
                    collections[data.c_id].item_ids.append(codelists[data.id_].id)

        [session.add(c) for c in collections.values()]
        [session.add(p) for p in phenotypes.values()]
        [session.add(cl) for cl in codelists.values()]
        session.commit()

    @dataclass
    class TC:
        query: str
        user_id: int
        want: list[int]

    parser = QueryParser(GrammarFactory.build_default())

    def test_phenotype_collection_search(self, session: Session):
        TC = self.TC
        tests = [
            TC("A visibility:own", 1, [1]),
            TC("B visibility:own", 1, [1, 2]),
            TC("A B visibility:own", 1, [1, 2]),
            TC("A AND B visibility:own", 1, [1]),
            TC("'B C' visibility:own", 1, [2]),
            TC("description:'Description B' visibility:own", 1, [2]),
            TC("A visibility:public", 1, []),  # pubic not implemented yet
            TC("visibility:own", 1, [1, 2, 3]),
        ]

        for test in tests:
            query = self.parser.parse(test.query)
            items, total = session.collection_repository.search(
                query, d.ItemType.Phenotype, _u_id(test.user_id), 100, None
            )
            assert set([_c_id(i + 0x10) for i in test.want]) == set(
                c.id for c in items
            ), f"q: '{test.query}', u: {test.user_id}"
            assert total == len(test.want), f"q: '{test.query}', u: {test.user_id}"

    def test_codelist_collection_search(self, session: Session):
        TC = self.TC
        tests = [
            TC("A visibility:own", 1, [6]),
            TC("B visibility:own", 1, [7]),
            TC("A B visibility:own", 1, [6, 7]),
            TC("name:'Description B' visibility:own", 1, []),
            TC("description:'Description B' visibility:own", 1, [7]),
            TC("name:Codes visibility:own", 2, [8]),
            TC("name:Codes visibility:shared", 2, [6]),
            TC("name:Codes visibility:'own,shared'", 2, [6, 8]),
            TC("name:Codes", 2, [6, 8]),
            TC("A visibility:public", 1, []),  # pubic not implemented yet
            TC("visibility:own", 1, [6, 7]),
        ]

        for test in tests:
            query = self.parser.parse(test.query)
            items, total = session.collection_repository.search(
                query, d.ItemType.Codelist, _u_id(test.user_id), 100, None
            )
            assert set([_c_id(i + 0x10) for i in test.want]) == set(
                c.id for c in items
            ), f"q: '{test.query}', u: {test.user_id}"
            assert total == len(test.want), f"q: '{test.query}', u: {test.user_id}"

    def test_phenotype_search(self, session: Session):
        TC = self.TC
        tests = [
            TC("A visibility:own", 1, [1]),
            TC("'A' OR 'D' OR 'G' OR 'K' visibility:own", 1, [1, 4, 7]),
            TC("'A' OR 'D' OR 'G' OR 'K' visibility:shared", 1, []),
            TC("'A' OR 'D' OR 'G' OR 'K' visibility:own", 2, [11]),
            TC("'A' OR 'D' OR 'G' OR 'K' visibility:shared", 2, [7]),
            TC("'A' OR 'D' OR 'G' OR 'K' visibility:'own,shared'", 2, [7, 11]),
            TC("'A' OR 'D' OR 'G' OR 'K'", 2, [7, 11]),
            TC("A visibility:public", 1, []),  # pubic not implemented yet
            TC("visibility:own", 1, [1, 2, 3, 4, 5, 6, 7]),
        ]

        for test in tests:
            query = self.parser.parse(test.query)
            items, total = session.phenotype_repository.search(
                query, _u_id(test.user_id), 100, None
            )
            assert set([_p_id(i + 0x10) for i in test.want]) == set(
                c.id for c in items
            ), f"q: '{test.query}', u: {test.user_id}"
            assert total == len(test.want), f"q: '{test.query}', u: {test.user_id}"

    def test_codelist_search(self, session: Session):
        TC = self.TC
        tests = [
            TC("A visibility:own", 1, [1]),
            TC("Codelist visibility:own", 1, [1, 2, 3, 4, 5, 6, 7, 12, 13]),
            TC("Codelist visibility:shared", 1, []),
            TC("Codelist visibility:own", 2, [8, 9, 10, 11, 14]),
            TC("Codelist visibility:shared", 2, [6, 7, 12]),
            TC("Codelist visibility:'own,shared'", 2, [6, 7, 8, 9, 10, 11, 12, 14]),
            TC("Codelist", 2, [6, 7, 8, 9, 10, 11, 12, 14]),
            TC("A visibility:public", 1, []),  # pubic not implemented yet
            TC("visibility:own", 1, [1, 2, 3, 4, 5, 6, 7, 12, 13]),
        ]

        for test in tests:
            query = self.parser.parse(test.query)
            items, total = session.codelist_repository.search(
                query, _u_id(test.user_id), 100, None
            )
            assert set([_cl_id(i + 0x10) for i in test.want]) == set(
                c.id for c in items
            ), f"q: '{test.query}', u: {test.user_id}"
            assert total == len(test.want), f"q: '{test.query}', u: {test.user_id}"

    def test_search_pagination(self, session: Session):
        TC = self.TC
        test = TC("Codelist visibility:'own,shared'", 2, [6, 7, 8, 9, 10, 11, 12, 14])

        query = self.parser.parse(test.query)

        items, total = session.codelist_repository.search(
            query, _u_id(test.user_id), 3, None
        )

        assert [_cl_id(i + 0x10) for i in test.want[:3]] == [
            c.id for c in items
        ], "p: 3 / None"
        assert total == len(test.want), "p: 3 / None"

        items, total = session.codelist_repository.search(
            query, _u_id(test.user_id), 3, _cl_id(10 + 0x10)
        )

        assert [_cl_id(i + 0x10) for i in [11, 12, 14]] == [
            c.id for c in items
        ], "p: 3 / 10"
        assert total == len(test.want), "p: 3 / 10"
