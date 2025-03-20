import pytest

import medconb.domain as d
import medconb.graphql.types as gql
from medconb.interactors import ClonePhenotype, Phenotype, PhenotypeNotExistsException

from ..helper import _c_id, _cl_ids, _p_id, _p_ids, _u_id
from .helper import MockSession, create_Codelist, create_Collection, create_Phenotype


@pytest.fixture
def user():
    workspace = d.Workspace(id="workspace_id", collection_ids=[])
    return d.User(id=_u_id(1), external_id="XYZ", name="Test User", workspace=workspace)


class TestQueryPhenotype:
    def test_query_public_phenotype(self, session: MockSession, user: d.User):
        session = MockSession()

        public_user = d.User(d.PUBLIC_USER_ID, "PBLC", "Everyone", None)
        other_user = d.User(_u_id(2), "DEV2", "Test 2", None)

        collection = create_Collection(
            shared_with={public_user}, _owner_id=other_user.id
        )
        phenotype = create_Phenotype()
        session.add(collection)
        session.add(phenotype)

        i8r = Phenotype(session, user)
        dto = gql.PhenotypeRequestDto(phenotype_id=phenotype.id)

        got = i8r(dto)

        assert got.id == phenotype.id


class TestClonePhenotype:
    def _reset_session(self, session: MockSession, user: d.User):
        session.clear()
        session.add(
            create_Collection(
                id=_c_id(1),
                item_ids=_p_ids([1, 2, 3, 4, 5]),
                item_type=d.ItemType.Phenotype,
            )
        )
        session.add(
            create_Collection(
                id=_c_id(2),
                item_ids=_p_ids([6, 7, 8, 9, 10]),
                item_type=d.ItemType.Phenotype,
            )
        )
        session.add(create_Collection(id=_c_id(3)))

        p_ids = map(_p_id, [1, 3, 5, 10, 11])
        c_ids = map(_c_id, [1, 1, 1, 2, 3])

        for p_id, c_id in zip(p_ids, c_ids):
            session.add(
                create_Phenotype(
                    id=p_id,
                    name=f"Phenotype {p_id}",
                    container=d.ContainerSpec(
                        id=c_id, type_=d.ContainerType.Collection
                    ),
                )
            )

        session.get(d.Phenotype, _p_id(1)).item_ids = _cl_ids([1, 2, 3])

        for cl_id in _cl_ids([1, 2, 3]):
            session.add(
                create_Codelist(
                    id=cl_id,
                    name=f"Codelist {cl_id}",
                    container=d.ContainerSpec(
                        id=_p_id(1), type_=d.ContainerType.Phenotype
                    ),
                )
            )

        user.workspace.collection_ids = [_c_id(1), _c_id(2)]

    def test_bad_id(self, user: d.User):
        """
        Tests that ClonePhenotype raises an exception if the
        phenotype with the given id does not exist or is not accessible
        to the current user.
        """
        session = MockSession()

        test_cases = [
            # test case 1: phenotype does not exist
            {"param": gql.ClonePhenotypeRequestDto(phenotype_id=_p_id(42))},
            # test case 2: phenotype is not accessible
            {"param": gql.ClonePhenotypeRequestDto(phenotype_id=_p_id(11))},
        ]

        for test_case in test_cases:
            self._reset_session(session, user)
            dto = test_case["param"]
            with pytest.raises(PhenotypeNotExistsException) as excinfo:
                ClonePhenotype(session, user)(dto)
            assert str(dto.phenotype_id) in str(excinfo.value)

    def test_clone_phenotype(self, user: d.User):  # noqa: R901 - too complex
        """
        Make sure the clone exists and has the correct content.
        """
        session = MockSession()

        self._reset_session(session, user)
        source: d.Phenotype = session.get(d.Phenotype, _p_id(1))

        dto = gql.ClonePhenotypeRequestDto(phenotype_id=_p_id(1))
        got = ClonePhenotype(session, user)(dto)

        assert isinstance(got, d.Phenotype)
        assert got.id != dto.phenotype_id
        assert got.name == source.name
        assert got.medical_description == source.medical_description
        assert got.operational_description == source.operational_description
        assert got.container == source.container
        assert got.reference_id == source.id
        assert got.properties == source.properties

        for got_item_id, source_item_id in zip(
            got.item_ids, source.item_ids, strict=True
        ):
            assert got_item_id != source_item_id

            got_item = session.get(d.Codelist, got_item_id)
            source_item = session.get(d.Codelist, source_item_id)

            assert got_item is not None
            assert got_item.name == source_item.name
            # details are tested in test for d.squash_codelist

    def test_positioning(self, user: d.User):
        """
        Make sure the clone is positioned correctly.
        """
        session = MockSession()

        test_cases = [
            # test case 1: position is None -> after source item
            {
                "position": None,
                "want": {
                    "container_id": _c_id(1),
                    "position": 3,
                },
            },
            # test case 2: position is the same container, first position
            {
                "position": gql.ReferencePosition(container_id=_c_id(1), item_id=None),
                "want": {
                    "container_id": _c_id(1),
                    "position": 0,
                },
            },
            # test case 3: position is the same container, after other item
            {
                "position": gql.ReferencePosition(
                    container_id=_c_id(1), item_id=_p_id(5)
                ),
                "want": {
                    "container_id": _c_id(1),
                    "position": 5,
                },
            },
            # test case 4: position is different container, first position
            {
                "position": gql.ReferencePosition(container_id=_c_id(2), item_id=None),
                "want": {
                    "container_id": _c_id(2),
                    "position": 0,
                },
            },
            # test case 5: position is different container, after other item
            {
                "position": gql.ReferencePosition(
                    container_id=_c_id(2), item_id=_p_id(10)
                ),
                "want": {
                    "container_id": _c_id(2),
                    "position": 5,
                },
            },
        ]

        for test_case in test_cases:
            self._reset_session(session, user)
            position: gql.ReferencePosition = test_case["position"]
            dto = gql.ClonePhenotypeRequestDto(phenotype_id=_p_id(3), position=position)
            got = ClonePhenotype(session, user)(dto)

            assert isinstance(got, d.Phenotype)
            assert got.container.id == test_case["want"]["container_id"]

            container = session.get(d.Collection, got.container.id)

            assert container.item_ids.index(got.id) == test_case["want"]["position"]
