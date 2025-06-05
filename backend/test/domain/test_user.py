import medconb.domain as d


class TestUserAuth:
    def test_is_not_authenticated_by_default(self):
        user = d.User(
            id=1,
            external_id="XYZ",
            name="name",
            email=None,
            password_hash=None,
            workspace=d.Workspace(id=1, collection_ids=[]),
        )

        assert user.is_authenticated is False

    def test_can_authenticate_user(self):
        user = d.User(
            id=1,
            external_id="XYZ",
            name="name",
            email=None,
            password_hash=None,
            workspace=d.Workspace(id=1, collection_ids=[]),
        )

        user.set_authenticated(True)
        assert user.is_authenticated is True

    def test_has_repr(self):
        user = d.User(
            id=1,
            external_id="XYZ",
            name="name",
            email=None,
            password_hash=None,
            workspace=d.Workspace(id=1, collection_ids=[]),
        )

        got = repr(user)

        assert got is not None
        assert "User" in got

    def test_implements_display_name(self):
        user = d.User(
            id=1,
            external_id="XYZ",
            name="name",
            email=None,
            password_hash=None,
            workspace=d.Workspace(id=1, collection_ids=[]),
        )

        assert user.display_name is not None
