from medconb.types import Session

from ...helper import _u_id


class TestGetAll:
    def test_get_all(self, session: Session):
        tests = [
            {
                "params": {},
                "want": [
                    {"id": _u_id(1), "external_id": "1", "name": "Developer"},
                    {"id": _u_id(2), "external_id": "2", "name": "Developer 2"},
                ],
            },
            {
                "params": {"user_ids": [_u_id(2)]},
                "want": [{"id": _u_id(2), "external_id": "2", "name": "Developer 2"}],
            },
            {
                "params": {"user_ids": []},
                "want": [],
            },
        ]

        # test that all wanted fields exist on the result objects
        # and that their values are the same.
        for test in tests:
            got = session.user_repository.get_all(**test["params"])
            for g, w in zip(got, test["want"], strict=True):
                assert g.__dict__.keys() & w.keys() == w.keys()
                assert {k: g.__dict__[k] for k in w.keys()} == w
