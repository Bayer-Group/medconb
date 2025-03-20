import pytest

import medconb.domain as d

from ..helper import _c_id, _cl_id, _cl_ids


def make_collection(
    id_: d.CollectionID = _c_id(1),
    name: str = "Test",
    type_: d.ItemType = d.ItemType.Codelist,
    codelist_ids: list[d.CodelistID] = [],
    shared_with: set[d.User] = set(),
    description: str = "Description",
) -> d.Collection:
    return d.Collection(
        id=id_,
        name=name,
        item_type=type_,
        item_ids=codelist_ids,
        shared_with=shared_with,
        description=description,
        _owner_id=None,
    )


def test_has_repr():
    collection = make_collection()

    got = repr(collection)

    assert got is not None
    assert "Collection" in got


class TestHasCodelist:
    def test_has(self):
        collection = make_collection(codelist_ids=_cl_ids([3, 7]))

        assert collection.has(_cl_id(3)) is True
        assert collection.has(_cl_id(7)) is True

    def test_has_not(self):
        collection = make_collection(codelist_ids=_cl_ids([3, 7]))

        assert collection.has(_cl_id(4)) is False
        assert collection.has(_cl_id(42)) is False


class TestAddOrMoveCodelistAfter:
    def test_add_as_first(self):
        collection = make_collection(codelist_ids=_cl_ids([3, 7]))

        collection.add_or_move_item_after(_cl_id(42))

        assert collection.item_ids == _cl_ids([42, 3, 7])

    def test_add_with_ref(self):
        collection = make_collection(codelist_ids=_cl_ids([3, 7]))

        collection.add_or_move_item_after(_cl_id(42), ref_item=_cl_id(3))

        assert collection.item_ids == _cl_ids([3, 42, 7])

    def test_move_to_first(self):
        collection = make_collection(codelist_ids=_cl_ids([3, 7]))

        collection.add_or_move_item_after(_cl_id(7))

        assert collection.item_ids == _cl_ids([7, 3])

    def test_move_with_ref(self):
        collection = make_collection(codelist_ids=_cl_ids([3, 7, 9]))

        collection.add_or_move_item_after(_cl_id(7), ref_item=_cl_id(9))

        assert collection.item_ids == _cl_ids([3, 9, 7])

    def test_move_with_bad_ref(self):
        collection = make_collection(codelist_ids=_cl_ids([3, 7]))

        with pytest.raises(ValueError):
            collection.add_or_move_item_after(_cl_id(7), ref_item=_cl_id(42))

    def test_bad_ref(self):
        collection = make_collection(codelist_ids=_cl_ids([3, 7]))

        with pytest.raises(ValueError):
            collection.add_or_move_item_after(_cl_id(42), ref_item=_cl_id(99))


class TestRemoveCodelist:
    def test_remove_if_not_in_collection(self):
        collection = make_collection(codelist_ids=_cl_ids([3, 7]))

        collection.remove_item(_cl_id(42))

        assert collection.item_ids == _cl_ids([3, 7])

    def test_remove_if_in_collection(self):
        collection = make_collection(codelist_ids=_cl_ids([3, 7, 42]))

        collection.remove_item(_cl_id(42))

        assert collection.item_ids == _cl_ids([3, 7])
