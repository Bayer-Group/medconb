import pytest

import medconb.domain as d
import medconb.graphql.types as gql
from medconb.interactors import (
    CloneCollection,
    Collection,
    CollectionNotExistsException,
    CreateCollection,
    DeleteCollection,
    MoveCollection,
    SetCollectionPermissions,
    UpdateCollection,
)
from medconb.types import Session

from ..helper import _c_id, _cl_id, _p_id, _u_id, _w_id
from .helper import MockSession, create_Codelist, create_Collection, create_Phenotype


class TestQueryCollection:
    def test_query_public_collection(self, session: MockSession, user: d.User):
        session = MockSession()

        public_user = d.User(
            id=d.PUBLIC_USER_ID,
            external_id="PBLC",
            name="Everyone",
            email=None,
            password_hash=None,
            workspace=None,
        )
        other_user = d.User(
            id=_u_id(2),
            external_id="DEV2",
            name="Test 2",
            email=None,
            password_hash=None,
            workspace=None,
        )

        collection = create_Collection(
            shared_with={public_user}, _owner_id=other_user.id
        )
        session.add(collection)

        i8r = Collection(session, user)
        dto = gql.CollectionRequestDto(id=collection.id)

        got = i8r(dto)

        assert got.id == collection.id


class TestMoveCollection:
    def test_execute_normal(self, session: Session, user: d.User):
        collection1 = create_Collection(id=_c_id(1), _owner_id=user.id)
        collection2 = create_Collection(id=_c_id(2), _owner_id=user.id)
        user.workspace.add_collection(collection2.id)
        user.workspace.add_collection(collection1.id)

        assert user.workspace.collection_ids == [_c_id(1), _c_id(2)]

        i8r = MoveCollection(session, user)
        dto = gql.MoveCollectionRequestDto(
            collection_id=_c_id(1), ref_collection_id=_c_id(2)
        )
        got = i8r(dto)

        assert got is True
        assert user.workspace.collection_ids == [_c_id(2), _c_id(1)]

    def test_same_ids(self, session: Session, user: d.User):
        i8r = MoveCollection(session, user)
        dto = gql.MoveCollectionRequestDto(
            collection_id=_c_id(1), ref_collection_id=_c_id(1)
        )
        got = i8r(dto)

        assert got is True
        assert user.workspace.collection_ids == []  # has not changed

    def test_invalid_ids(self, session: Session, user: d.User):
        i8r = MoveCollection(session, user)
        dto = gql.MoveCollectionRequestDto(
            collection_id=_c_id(1), ref_collection_id=_c_id(2)
        )

        with pytest.raises(CollectionNotExistsException) as excinfo:
            i8r(dto)
        assert f"ID {dto.collection_id}" in repr(excinfo.value)


class TestCreateCollection:
    def test_execution(self, session: Session, user: d.User):
        session.collection_repository.new_id.return_value = _c_id(42)

        want = d.Collection(
            id=_c_id(42),
            name="Test",
            item_type=d.ItemType.Codelist,
            item_ids=[],
            shared_with=set(),
            _owner_id=user.id,
            description="",
        )

        i8r = CreateCollection(session, user)
        dto = gql.CreateCollectionRequestDto(name=want.name, item_type=want.item_type)

        got = i8r(dto)

        assert got.id == want.id
        assert got.name == want.name
        assert got.item_type == want.item_type
        assert got.item_ids == want.item_ids
        assert got.description == want.description
        assert user.workspace.contains_collection(want.id)

        session.add.assert_called_once_with(got)


class TestUpdateCollection:
    def test_name_and_description(self, session: Session, user: d.User):
        collection = create_Collection()
        user.workspace.add_collection(collection.id)
        session.collection_repository.get.return_value = collection

        i8r = UpdateCollection(session, user)
        dto = gql.UpdateCollectionRequestDto(
            collection_id=_c_id(1), name="Test", description="Description"
        )

        got = i8r(dto)

        assert got.id == _c_id(1)
        assert got.name == dto.name
        assert got.description == dto.description
        session.collection_repository.get.assert_called_once_with(dto.collection_id)

    def test_name_only(self, session: Session, user: d.User):
        collection = create_Collection()
        user.workspace.add_collection(collection.id)
        session.collection_repository.get.return_value = collection

        i8r = UpdateCollection(session, user)
        dto = gql.UpdateCollectionRequestDto(collection_id=_c_id(1), name="Test")

        got = i8r(dto)

        assert got.id == _c_id(1)
        assert got.name == dto.name
        assert got.item_type == d.ItemType.Codelist
        assert got.description == "Test Description"
        session.collection_repository.get.assert_called_once_with(dto.collection_id)

    def test_description_only(self, session: Session, user: d.User):
        collection = create_Collection()
        user.workspace.add_collection(collection.id)
        session.collection_repository.get.return_value = collection

        i8r = UpdateCollection(session, user)
        dto = gql.UpdateCollectionRequestDto(
            collection_id=_c_id(1), description="Description"
        )

        got = i8r(dto)

        assert got.id == _c_id(1)
        assert got.name == "Test Collection"
        assert got.item_type == d.ItemType.Codelist
        assert got.description == dto.description
        session.collection_repository.get.assert_called_once_with(dto.collection_id)

    def test_invalid_id(self, session: Session, user: d.User):
        i8r = UpdateCollection(session, user)
        dto = gql.UpdateCollectionRequestDto(collection_id=_c_id(1))

        with pytest.raises(CollectionNotExistsException) as excinfo:
            i8r(dto)
        assert f"ID {dto.collection_id}" in repr(excinfo.value)

    def test_delete_before_change(self, session: Session, user: d.User):
        i8r = UpdateCollection(session, user)
        dto = gql.UpdateCollectionRequestDto(collection_id=_c_id(1))

        with pytest.raises(CollectionNotExistsException) as excinfo:
            i8r(dto)
        assert f"ID {dto.collection_id}" in repr(excinfo.value)


class TestDeleteCollection:
    def _reset_session(self, session: MockSession, user: d.User):
        session.clear()
        collection_cl = create_Collection()
        collection_p = create_Collection(id=_c_id(2), item_type=d.ItemType.Phenotype)
        user.workspace.add_collection(collection_cl.id)
        user.workspace.add_collection(collection_p.id)
        session.add(collection_cl)
        session.add(collection_p)

        codelist = create_Codelist(id=_cl_id(1), container=collection_cl.to_spec())
        collection_cl.add_or_move_item_after(codelist.id, None)
        session.add(codelist)

        phenotype = create_Phenotype(id=_p_id(2), container=collection_p.to_spec())
        collection_p.add_or_move_item_after(phenotype.id, None)
        session.add(phenotype)

    def test_removes_from_workspace(self, session: Session, user: d.User):
        session = MockSession()
        self._reset_session(session, user)

        i8r = DeleteCollection(session, user)
        dto = gql.DeleteCollectionRequestDto(collection_id=_c_id(1))

        assert i8r(dto) is True
        assert not user.workspace.contains_collection(_c_id(1))

    def test_deletes_collection(self, session: Session, user: d.User):
        session = MockSession()
        self._reset_session(session, user)

        i8r = DeleteCollection(session, user)
        dto = gql.DeleteCollectionRequestDto(collection_id=_c_id(1))

        assert i8r(dto) is True
        assert session.collection_repository.get(_c_id(1)) is None

    def test_deletes_all_codelists(self, session: Session, user: d.User):
        session = MockSession()
        self._reset_session(session, user)

        i8r = DeleteCollection(session, user)
        dto = gql.DeleteCollectionRequestDto(collection_id=_c_id(1))

        assert i8r(dto) is True
        assert session.codelist_repository.get_all() == []

    def test_deletes_all_phenotypes(self, session: Session, user: d.User):
        session = MockSession()
        self._reset_session(session, user)

        i8r = DeleteCollection(session, user)
        dto = gql.DeleteCollectionRequestDto(collection_id=_c_id(2))

        assert i8r(dto) is True
        assert session.phenotype_repository.get_all() == []

    def test_invalid_id(self, session: Session, user: d.User):
        user.workspace = d.Workspace(_w_id(1), [])

        i8r = DeleteCollection(session, user)
        dto = gql.DeleteCollectionRequestDto(collection_id=_c_id(1))

        with pytest.raises(CollectionNotExistsException) as excinfo:
            i8r(dto)
        assert f"ID {dto.collection_id}" in repr(excinfo.value)


class TestSetCollectionPermissions:
    def test_execute_successful(self, session: Session, user: d.User):
        collection = create_Collection()
        user.workspace.add_collection(collection.id)
        shared_users = [
            d.User(
                id=_u_id(1),
                external_id="",
                name="",
                email=None,
                password_hash=None,
                workspace=None,
            )
        ]
        session.collection_repository.get.return_value = collection
        session.user_repository.get_all.return_value = shared_users

        i8r = SetCollectionPermissions(session, user)
        dto = gql.SetCollectionPermissionsRequestDto(
            collection_id=_c_id(1), reader_ids=[_u_id(1)]
        )

        assert i8r(dto) is True
        assert collection.shared_with == set(shared_users)

    def test_invalid_collection(self, session: Session, user: d.User):
        i8r = SetCollectionPermissions(session, user)
        dto = gql.SetCollectionPermissionsRequestDto(
            collection_id=_c_id(1), reader_ids=[_u_id(1)]
        )

        with pytest.raises(CollectionNotExistsException) as excinfo:
            i8r(dto)
        assert f"ID {dto.collection_id}" in repr(excinfo.value)


class TestCloneCollection:
    def test_clone_codelist_collection(self, session: Session, user: d.User):
        """Test cloning a collection with codelists"""
        session = MockSession()

        # Create source collection with codelists (shared with user)
        collection = create_Collection(
            id=_c_id(1),
            name="Source Collection",
            item_ids=[_cl_id(1), _cl_id(2)],
            _owner_id=_u_id(2),
            shared_with={user},
        )
        session.add(collection)

        codelist1 = create_Codelist(
            id=_cl_id(1), name="Codelist 1", container=collection.to_spec()
        )
        codelist2 = create_Codelist(
            id=_cl_id(2), name="Codelist 2", container=collection.to_spec()
        )
        session.add(codelist1)
        session.add(codelist2)

        i8r = CloneCollection(session, user)
        dto = gql.CloneCollectionRequestDto(collection_id=_c_id(1))

        result = i8r(dto)

        # Verify new collection was created
        assert result.name == "Source Collection"
        assert result.item_type == d.ItemType.Codelist
        assert result.reference_id == _c_id(1)
        assert result.owner_id == user.id
        assert result.shared_with == set()  # Not shared with anyone

        # Verify collection was added to workspace
        assert user.workspace.contains_collection(result.id)

        # Verify codelists were cloned
        assert len(result.item_ids) == 2

    def test_clone_with_name_conflict(self, session: Session, user: d.User):
        """Test that name conflicts are handled with (copy) suffix"""
        session = MockSession()

        # Create source collection (shared with user)
        collection = create_Collection(
            id=_c_id(1),
            name="Source Collection",
            _owner_id=_u_id(2),
            shared_with={user},
        )
        session.add(collection)

        # Add existing collection with same name to workspace
        existing = create_Collection(
            id=_c_id(3), name="Source Collection", _owner_id=user.id
        )
        user.workspace.add_collection(existing.id)
        session.add(existing)

        i8r = CloneCollection(session, user)
        dto = gql.CloneCollectionRequestDto(collection_id=_c_id(1))

        result = i8r(dto)

        # Verify name was modified to avoid conflict
        assert result.name == "Source Collection (copy)"
        assert result.shared_with == set()  # Not shared with anyone

    def test_clone_with_multiple_name_conflicts(self, session: Session, user: d.User):
        """Test handling multiple name conflicts"""
        session = MockSession()

        # Create source collection (shared with user)
        collection = create_Collection(
            id=_c_id(1),
            name="Source Collection",
            _owner_id=_u_id(2),
            shared_with={user},
        )
        session.add(collection)

        # Add existing collections with conflicting names
        existing1 = create_Collection(
            id=_c_id(3), name="Source Collection", _owner_id=user.id
        )
        existing2 = create_Collection(
            id=_c_id(4), name="Source Collection (copy)", _owner_id=user.id
        )
        user.workspace.add_collection(existing1.id)
        user.workspace.add_collection(existing2.id)
        session.add(existing1)
        session.add(existing2)

        i8r = CloneCollection(session, user)
        dto = gql.CloneCollectionRequestDto(collection_id=_c_id(1))

        result = i8r(dto)

        # Verify name was modified with incremented suffix
        assert result.name == "Source Collection (copy 2)"
        assert result.shared_with == set()  # Not shared with anyone

    def test_clone_invalid_collection(self, session: Session, user: d.User):
        """Test cloning non-existent collection raises exception"""
        session = MockSession()

        i8r = CloneCollection(session, user)
        dto = gql.CloneCollectionRequestDto(collection_id=_c_id(999))

        with pytest.raises(CollectionNotExistsException) as excinfo:
            i8r(dto)
        assert f"ID {dto.collection_id}" in repr(excinfo.value)

    def test_clone_preserves_description(self, session: Session, user: d.User):
        """Test that description is preserved when cloning"""
        session = MockSession()

        collection = create_Collection(
            id=_c_id(1),
            name="Test Collection",
            description="Test Description",
            _owner_id=_u_id(2),
            shared_with={user},
        )
        session.add(collection)

        i8r = CloneCollection(session, user)
        dto = gql.CloneCollectionRequestDto(collection_id=_c_id(1))

        result = i8r(dto)

        assert result.description == "Test Description"
        assert result.shared_with == set()  # Not shared with anyone

    def test_clone_properties_handling(  # noqa: radon complexity
        self, session: Session, user: d.User
    ):
        """
        Test that timestamp/user properties are updated and other
        properties are copied
        """
        session = MockSession()

        other_user = d.User(
            id=_u_id(2),
            external_id="OTHER",
            name="Other User",
            email=None,
            password_hash=None,
            workspace=None,
        )

        # Create source collection with various properties
        collection = create_Collection(
            id=_c_id(1),
            name="Source Collection",
            _owner_id=other_user.id,
            shared_with={user},
            properties={
                "Created": "2025-01-01T00:00:00Z",
                "Last Edited": "2025-01-02T00:00:00Z",
                "Created By": str(other_user.id),
                "Last Edited By": str(other_user.id),
                "Custom Property": "Custom Value",
                "Another Property": 123,
            },
        )
        session.add(collection)

        i8r = CloneCollection(session, user)
        dto = gql.CloneCollectionRequestDto(collection_id=_c_id(1))

        result = i8r(dto)

        # Verify timestamp/user properties are set for new collection
        assert "Created" in result.properties
        assert "Created By" in result.properties

        # Properties are stored as tuples (property_id, value)
        # These should be different from the source (updated to current user/time)
        assert result.properties["Created"][1] != collection.properties["Created"]
        assert result.properties["Created By"][1] == str(user.id)

        # Last Edited properties are not set on creation (only on updates)
        # so they should not exist in the result
        assert "Last Edited" not in result.properties
        assert "Last Edited By" not in result.properties

        # Custom properties should be copied from the source collection
        assert "Custom Property" in result.properties
        assert (
            result.properties["Custom Property"]
            == collection.properties["Custom Property"]
        )
        assert "Another Property" in result.properties
        assert (
            result.properties["Another Property"]
            == collection.properties["Another Property"]
        )
