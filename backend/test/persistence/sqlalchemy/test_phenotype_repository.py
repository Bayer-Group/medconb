import medconb.domain as d
from medconb.types import Session

from ...helper import _cl_id, _p_id


class TestGet:
    def test_get(self, session: Session):
        tests = [
            {
                "params": {"phenotype_id": _p_id(1)},
                "want": {
                    "id": _p_id(1),
                    "name": "CKD",
                    "properties": {"Used for": (1, "inclusion")},
                    # codelists is not in __dict__, it's a property
                },
            }
        ]

        # test that all wanted fields exist on the result objects
        # and that their values are the same.
        for test in tests:
            got = session.phenotype_repository.get(**test["params"])

            assert got.__dict__.keys() & test["want"].keys() == test["want"].keys()
            assert {k: got.__dict__[k] for k in test["want"].keys()} == test["want"]

    def test_get_codelists(self, session: Session):
        got = session.phenotype_repository.get(phenotype_id=_p_id(1))
        assert got.codelists == [_cl_id(9)]


class TestGetBy:
    def test_get_by(self, session: Session):
        tests = [
            {
                "params": {
                    "property": "name",
                    "value": "CKD",
                },
                "want": {_p_id(1)},
            },
        ]

        for test in tests:
            got = session.phenotype_repository.get_by(**test["params"])
            assert {o.id for o in got} == test["want"]


class TestProperty:
    def test_deserialization(self, session: Session):
        got = session.phenotype_repository.get(phenotype_id=_p_id(1))
        assert all((isinstance(k, str) for k in got.properties.keys()))
        assert all(
            (isinstance(id_, d.PropertyID) for (id_, _) in got.properties.values())
        )
        assert all((isinstance(val, str) for (_, val) in got.properties.values()))

    def test_mutability(self, session: Session):
        want = session.phenotype_repository.get(phenotype_id=_p_id(1))
        want.properties["foo"] = (None, "bar")
        session.commit()

        got = session.phenotype_repository.get(phenotype_id=_p_id(1))
        assert set(got.properties.keys()) == {"Used for", "foo"}
        assert got.properties["foo"] == got.properties["foo"]

    def test_mutability_existing_key(self, session: Session):
        want = session.phenotype_repository.get(phenotype_id=_p_id(1))
        want.properties["Used for"] = (1, "exclusion")
        session.commit()

        got = session.phenotype_repository.get(phenotype_id=_p_id(1))
        assert set(got.properties.keys()) == {"Used for"}
        assert got.properties["Used for"] == (1, "exclusion")

    def test_schema(self, session: Session):
        got = session.property_repository.get_all(d.PropertyClass.Phenotype)

        assert len(got)
