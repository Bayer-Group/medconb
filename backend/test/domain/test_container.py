import io
import textwrap

import pytest

import medconb.domain as d

from ..helper import _cl_id, _p_id
from .conftest import _print_workspace


class TestAddOrMoveItem:
    def test_add_top_level_first(
        self,
        test_data: tuple[d.User, dict[int, d.Collection], list[int, d.Codelist]],
    ):
        user, collections, codelists = test_data

        new_codelist = d.Codelist(
            id=_cl_id(9999),
            name="New CL",
            description="",
            commits=[],
            transient_commit=None,
            container=collections[2].to_spec(),
        )
        codelists[9999] = new_codelist

        want = textwrap.dedent(
            """\
        Stork (id=1, #=2)
        - 11 (name=right)
        - 12 (name=heart failure)
        ECA (id=2, #=3)
        - 9999 (name=New CL)
        - 21 (name=bleed)
        - 22 (name=bleed (copy))
        ECA (copy) (id=3, #=1)
        - 31 (name=bleed)
        Temp (id=4, #=1)
        - 41 (name=covid)
        """
        )

        d.add_or_move_item(
            container=None,
            item=new_codelist,
            ref_container=collections[2],
            ref_item=None,
        )

        buf = io.StringIO()
        _print_workspace(user.workspace, collections, codelists, file=buf)
        tree = buf.getvalue()

        assert tree == want

    def test_add_top_level_middle(
        self,
        test_data: tuple[d.User, dict[int, d.Collection], list[int, d.Codelist]],
    ):
        user, collections, codelists = test_data

        new_codelist = d.Codelist(
            id=_cl_id(9999),
            name="New CL",
            description="",
            commits=[],
            transient_commit=None,
            container=collections[2].to_spec(),
        )
        codelists[9999] = new_codelist

        want = textwrap.dedent(
            """\
        Stork (id=1, #=2)
        - 11 (name=right)
        - 12 (name=heart failure)
        ECA (id=2, #=3)
        - 21 (name=bleed)
        - 9999 (name=New CL)
        - 22 (name=bleed (copy))
        ECA (copy) (id=3, #=1)
        - 31 (name=bleed)
        Temp (id=4, #=1)
        - 41 (name=covid)
        """
        )

        d.add_or_move_item(
            container=None,
            item=new_codelist,
            ref_container=collections[2],
            ref_item=codelists[21],
        )

        buf = io.StringIO()
        _print_workspace(user.workspace, collections, codelists, file=buf)
        tree = buf.getvalue()

        assert tree == want

    def test_move_top_level_first_from_other_collection(
        self,
        test_data: tuple[d.User, dict[int, d.Collection], list[int, d.Codelist]],
    ):
        user, collections, codelists = test_data

        want = textwrap.dedent(
            """\
        Stork (id=1, #=2)
        - 11 (name=right)
        - 12 (name=heart failure)
        ECA (id=2, #=3)
        - 31 (name=bleed)
        - 21 (name=bleed)
        - 22 (name=bleed (copy))
        ECA (copy) (id=3, #=0)
        Temp (id=4, #=1)
        - 41 (name=covid)
        """
        )

        d.add_or_move_item(
            container=collections[3],
            item=codelists[31],
            ref_container=collections[2],
            ref_item=None,
        )

        buf = io.StringIO()
        _print_workspace(user.workspace, collections, codelists, file=buf)
        tree = buf.getvalue()

        assert tree == want

    def test_codelist_not_in_collection(
        self,
        test_data: tuple[d.User, dict[int, d.Collection], list[int, d.Codelist]],
    ):
        _, collections, codelists = test_data

        new_codelist = d.Codelist(
            id=_cl_id(9999),
            name="New CL",
            description="",
            commits=[],
            transient_commit=None,
            container=collections[3].to_spec(),
        )
        codelists[new_codelist.id] = new_codelist

        with pytest.raises(ValueError) as excinfo:
            d.add_or_move_item(
                container=collections[1],
                item=new_codelist,
                ref_container=collections[3],
                ref_item=codelists[31],
            )
        assert "Given container" in repr(excinfo.value)

    def test_ref_codelist_not_in_ref_collection(
        self,
        test_data: tuple[d.User, dict[int, d.Collection], list[int, d.Codelist]],
    ):
        _, collections, codelists = test_data

        new_codelist = d.Codelist(
            id=_cl_id(9999),
            name="New CL",
            description="",
            commits=[],
            transient_commit=None,
            container=collections[2].to_spec(),
        )
        codelists[new_codelist.id] = new_codelist

        with pytest.raises(ValueError) as excinfo:
            d.add_or_move_item(
                container=None,
                item=new_codelist,
                ref_container=collections[2],
                ref_item=codelists[31],
            )
        assert "given ref_item" in repr(excinfo.value)

    def test_codelist_equals_ref_codelist(
        self,
        test_data: tuple[d.User, dict[int, d.Collection], list[int, d.Codelist]],
    ):
        _, collections, codelists = test_data

        new_codelist = d.Codelist(
            id=_cl_id(9999),
            name="New CL",
            description="",
            commits=[],
            transient_commit=None,
            container=collections[1].to_spec(),
        )
        codelists[new_codelist.id] = new_codelist

        with pytest.raises(ValueError) as excinfo:
            d.add_or_move_item(
                container=collections[1],
                item=codelists[12],
                ref_container=collections[1],
                ref_item=codelists[12],
            )
        assert "after itself" in repr(excinfo.value)

    def test_fail_adding_wrong_item_type(
        self,
        test_data: tuple[d.User, dict[int, d.Collection], list[int, d.Codelist]],
    ):
        _, collections, items = test_data

        new_item = d.Phenotype(
            id=_p_id(9999),
            name="Phenotype",
            medical_description="",
            operational_description="",
            item_ids=[],
            container=collections[1].to_spec(),
        )

        items[new_item.id] = new_item

        with pytest.raises(ValueError) as excinfo:
            d.add_or_move_item(
                container=None,
                item=new_item,
                ref_container=collections[1],
                ref_item=items[12],
            )
        assert "of type Phenotype into collection" in repr(excinfo.value)
