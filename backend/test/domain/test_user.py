import medconb.domain as d


class TestUserAuth:
    def test_is_not_authenticated_by_default(self):
        user = d.User(1, "XYZ", "name", d.Workspace(1, []))

        assert user.is_authenticated is False

    def test_can_authenticate_user(self):
        user = d.User(1, "XYZ", "name", d.Workspace(1, []))

        user.set_authenticated(True)
        assert user.is_authenticated is True

    def test_has_repr(self):
        user = d.User(1, "XYZ", "name", d.Workspace(1, []))

        got = repr(user)

        assert got is not None
        assert "User" in got

    def test_implements_display_name(self):
        user = d.User(1, "XYZ", "name", d.Workspace(1, []))

        assert user.display_name is not None
