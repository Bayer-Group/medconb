import pytest

import medconb.domain as d


def test_has_repr():
    workspace = d.Workspace(1, [])

    got = repr(workspace)

    assert got is not None
    assert "Workspace" in got


class TestContainsCollection:
    def test_does_contain(self):
        ws = d.Workspace(1, collection_ids=[1, 3, 4, 13])
        assert ws.contains_collection(3)

    def test_does_not_contain(self):
        ws = d.Workspace(1, collection_ids=[1, 3, 4, 13])
        assert not ws.contains_collection(10)


class TestAddCollection:
    def test_successful(self):
        ws = d.Workspace(1, collection_ids=[1, 3, 4, 13])

        ws.add_collection(20)
        assert ws.collection_ids == [20, 1, 3, 4, 13]

    def test_already_in_workspace(self):
        ws = d.Workspace(1, collection_ids=[1, 3, 4, 13])

        ws.add_collection(13)
        assert ws.collection_ids == [1, 3, 4, 13]


class TestRemoveCollection:
    def test_successful(self):
        ws = d.Workspace(1, collection_ids=[1, 3, 4, 13])

        ws.remove_collection(4)
        assert ws.collection_ids == [1, 3, 13]

    def test_not_in_workspace(self):
        ws = d.Workspace(1, collection_ids=[1, 3, 4, 13])

        with pytest.raises(d.CollectionNotInWorkspaceException) as excinfo:
            ws.remove_collection(20)
        assert f"ID {20}" in repr(excinfo.value)


class TestMoveCollectionAfter:
    def test_move_to_start(self):
        ws = d.Workspace(1, collection_ids=[1, 3, 4, 13])

        ws.move_collection_after(4, None)
        assert ws.collection_ids == [4, 1, 3, 13]

    def test_move_after_existing(self):
        ws = d.Workspace(1, collection_ids=[1, 3, 4, 13])

        ws.move_collection_after(4, 1)
        assert ws.collection_ids == [1, 4, 3, 13]

    def test_move_not_existing(self):
        ws = d.Workspace(1, collection_ids=[1, 3, 4, 13])

        with pytest.raises(d.CollectionNotInWorkspaceException) as excinfo:
            ws.move_collection_after(20, 13)
        assert f"ID {20}" in repr(excinfo.value)

    def test_move_after_not_existing(self):
        ws = d.Workspace(1, collection_ids=[1, 3, 4, 13])

        with pytest.raises(d.CollectionNotInWorkspaceException) as excinfo:
            ws.move_collection_after(3, 20)
        assert f"ID {20}" in repr(excinfo.value)
