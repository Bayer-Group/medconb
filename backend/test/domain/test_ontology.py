import medconb.domain as d


class TestCodeParentId:
    def test_when_not_root(self):
        code = d.Code(43, "", "", "", [39, 40, 41, 42, 43], [], 43)
        assert code.parent_id == 42

    def test_when_root(self):
        code = d.Code(42, "", "", "", [42], [], 42)
        assert code.parent_id is None


def test_ontology_name_is_id():
    ontology = d.Ontology("ICD-9", [])
    assert ontology.name == ontology.id
