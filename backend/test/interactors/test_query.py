import pytest

import medconb.domain as d
import medconb.graphql.types as gql
from medconb.interactors import Codelist, Collection, CollectionNotExistsException

from ..helper import _c_id, _cl_id, _cl_ids, _u_id
from .helper import MockSession, create_Codelist, create_Collection


def _reset_session(session: MockSession, user: d.User):
    session.clear()

    collection = create_Collection(
        id=_c_id(1), item_ids=_cl_ids([1, 2, 3, 4, 5]), _owner_id=user.id
    )
    user.workspace.add_collection(collection.id)
    session.add(collection)

    for id_ in map(_cl_id, [1, 2, 3, 4, 5]):
        session.add(
            create_Codelist(id=id_, name=f"CL {id_}", container=collection.to_spec())
        )

    collection = create_Collection(
        id=_c_id(10), item_ids=_cl_ids([10, 11, 12]), _owner_id=_u_id(2)
    )
    session.add(collection)
    for id_ in map(_cl_id, [10, 11, 12]):
        session.add(
            create_Codelist(id=id_, name=f"CL {id_}", container=collection.to_spec())
        )

    collection = create_Collection(
        id=_c_id(20),
        item_ids=_cl_ids([20, 21, 23]),
        _owner_id=_u_id(3),
        shared_with=set([user]),
    )
    session.add(collection)
    for id_ in map(_cl_id, [20, 21, 23]):
        session.add(
            create_Codelist(id=id_, name=f"CL {id_}", container=collection.to_spec())
        )


@pytest.fixture
def session(user: d.User):
    session = MockSession()
    _reset_session(session, user)
    return session


class TestCollection:
    def test_success_when_in_workspace(self, session: MockSession, user: d.User):
        collection: d.Collection = session.get(d.Collection, _c_id(1))

        i8r = Collection(session, user)
        dto = gql.CollectionRequestDto(id=collection.id)

        got = i8r(dto)

        assert got.id == dto.id

    def test_success_when_shared(self, session: MockSession, user: d.User):
        collection: d.Collection = session.get(d.Collection, _c_id(20))

        i8r = Collection(session, user)
        dto = gql.CollectionRequestDto(id=collection.id)

        got = i8r(dto)

        assert got.id == dto.id

    def test_id_not_in_workspace(self, session: MockSession, user: d.User):
        collection: d.Collection = session.get(d.Collection, _c_id(10))

        i8r = Collection(session, user)
        dto = gql.CollectionRequestDto(id=collection.id)

        with pytest.raises(CollectionNotExistsException) as excinfo:
            i8r(dto)
        assert f"ID {dto.id}" in repr(excinfo.value)

    def test_id_not_exists(self, session: MockSession, user: d.User):
        i8r = Collection(session, user)
        dto = gql.CollectionRequestDto(id=_c_id(42))

        with pytest.raises(CollectionNotExistsException) as excinfo:
            i8r(dto)
        assert f"ID {dto.id}" in repr(excinfo.value)


class TestCodelist:
    def test_execute_normal(self, session: MockSession, user: d.User):
        codelist: d.Codelist = session.get(d.Codelist, _cl_id(1))

        i8r = Codelist(session, user)
        dto = gql.CodelistRequestDto(codelist_id=codelist.id)

        got = i8r(dto)

        assert got.id == dto.codelist_id
