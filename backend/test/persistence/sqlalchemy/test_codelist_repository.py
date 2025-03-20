from medconb.types import Session

from ...helper import _cl_id


class TestGetBy:
    def test_get_by(self, session: Session):
        tests = [
            {
                "params": {
                    "property": "reference_id",
                    "value": "00000000-0000-0000-0004-000000000008",
                },
                "want": {_cl_id(9)},
            },
            {
                "params": {
                    "property": "name",
                    "value": "Angina",
                },
                "want": {_cl_id(3), _cl_id(7)},
            },
        ]

        for test in tests:
            got = session.codelist_repository.get_by(**test["params"])
            assert {o.id for o in got} == test["want"]
