from unittest.mock import MagicMock, create_autospec

import medconb.domain as d
from medconb.graphql.query import resolve_codes, resolve_ontology, resolve_parent
from medconb.types import CodeRepository


def test_resolve_ontology_on_codeset():
    info = MagicMock()
    repo = create_autospec(CodeRepository)
    want = create_autospec(d.Ontology)
    repo.get.return_value = want

    info.context["any"].scope["any"].ontology_repository = repo
    codeset = d.Codeset("ICD-9", [1, 2, 3])

    got = resolve_ontology(codeset, info)

    repo.get.assert_called_once_with(codeset.ontology_id)
    assert got == want


def test_resolve_codes_via_repository():
    info = MagicMock()
    repo = create_autospec(CodeRepository)
    repo.get_all.return_value = []

    info.context["any"].scope["any"].code_repository = repo
    info.field_nodes = [MagicMock()]
    info.field_nodes[0].selection_set.selections = ["id", "name"]

    codeset = d.Codeset("ICD-9", [1, 2, 3])

    got = resolve_codes(codeset, info)

    repo.get_all.assert_called_once_with(codeset.code_ids)
    assert got == repo.get_all.return_value


def test_resolve_parent_via_repository():
    info = MagicMock()
    repo = create_autospec(CodeRepository)
    repo.get.return_value = ["FOO", "BAR"]

    info.context["any"].scope["any"].code_repository = repo

    code = d.Code(42, "", "", "", [40, 41, 42], [], 42)

    got = resolve_parent(code, info)

    repo.get.assert_called_once_with(code.parent_id)
    assert got == repo.get.return_value


def test_resolve_parent_when_root():
    info = MagicMock()
    repo = create_autospec(CodeRepository)

    info.context["any"].scope["any"].code_repository = repo

    code = d.Code(42, "", "", "", [42], [], 42)

    got = resolve_parent(code, info)

    repo.get.assert_not_called()
    assert got is None
