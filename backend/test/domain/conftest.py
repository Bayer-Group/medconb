import sys

import pytest

import medconb.domain as d

from ..helper import _c_id, _cl_id, _u_id


def _s_uuid(uuid):
    return uuid.int & 0xFFFFFF


def make_collection(
    id_: d.CollectionID = _c_id(1),
    name: str = "C",
    type_: d.ItemType = d.ItemType.Codelist,
    codelist_ids: list[d.CodelistID] = [],
    shared_with: set[d.User] = set(),
    description: str = "",
):
    return d.Collection(
        id=id_,
        name=name,
        item_type=type_,
        item_ids=list(codelist_ids),
        shared_with=set(shared_with),
        description=description,
        _owner_id=_u_id(1),
    )


def _print_tree(cl: d.Codelist, level=0, /, file=sys.stdout):
    print(
        " " * level + f"- {_s_uuid(cl.id)} " f"(name={cl.name})",
        file=file,
    )


def _print_workspace(
    ws: d.Workspace,
    collections: list[d.Collection],
    codelists: list[d.Codelist],
    /,
    file=sys.stdout,
):
    for c_id in ws.collection_ids:
        c = collections[c_id.int & 0xFFFFFF]
        print(
            f"{c.name} (id={c.id.int & 0xFFFFFF}, #={len(c.item_ids)})",
            file=file,
        )
        for codelist_id in c.item_ids:
            _print_tree(codelists[codelist_id.int & 0xFFFFFF], file=file)


@pytest.fixture
def test_data():
    """
    Creates the following tree structure:

    Stork (id=1, #=5)
    - 11 (name=right)
    - 12 (name=heart failure)
    ECA (id=2, #=3)
    - 21 (name=bleed)
    - 22 (name=bleed (copy))
    ECA (copy) (id=3, #=1)
    - 31 (name=bleed)
    Temp (id=4, #=1)
    - 41 (name=covid)
    """
    workspace = d.Workspace(1, [])

    collections: dict[int, d.Collection] = {}
    for id_, name in zip(range(1, 5), ["Stork", "ECA", "ECA (copy)", "Temp"]):
        collections[id_] = make_collection(_c_id(id_), name)
        workspace.add_collection(collections[id_].id)

    workspace.collection_ids = workspace.collection_ids[::-1]

    # fmt: off
    codelists: dict[int, d.Codelist] = {}
    for id_, name in zip(
        [
            11, 12,
            21, 22,
            31, 41,
        ],
        [
            "right", "heart failure",
            "bleed", "bleed (copy)",
            "bleed", "covid",
        ],
    ):
        codelists[id_] = d.Codelist(
            id=_cl_id(id_),
            name=name,
            description="",
            commits=[],
            transient_commit=None,
            container=d.ContainerSpec(type_=d.ContainerType.Collection, id=_c_id(1)),
        )
    # fmt: on

    codelists_r = {v.id: k for k, v in codelists.items()}

    for codelist in list(codelists.values())[::-1]:
        str_id = str(codelists_r[codelist.id])
        collection = collections[int(str_id[0])]
        collection.add_or_move_item_after(codelist.id)
        codelist.container.id = collection.id

    _print_workspace(workspace, collections, codelists)

    return d.User(_u_id(1), "VERA", "name", workspace), collections, codelists
