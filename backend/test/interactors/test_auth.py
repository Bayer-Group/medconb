import pytest

import medconb.graphql.types as gql
from medconb.config import config
from medconb.interactors.auth import Login, RegisterUser

from .helper import MockSession


@pytest.fixture(autouse=True)
def patch_config():
    config["auth"]["password"]["secret"] = "secret"
    config["auth"]["password"]["exists"] = lambda: True
    yield


class TestRegisterUser:
    def test_register_success(self):
        session = MockSession()
        user = None
        dto = gql.RegisterUserRequestDto(
            email="test@example.com", password="pw", name="Test"
        )
        assert RegisterUser(session, user)(dto) is True
        assert session.user_repository.get_by_email("test@example.com") is not None

    def test_register_existing_email(self):
        session = MockSession()
        user = None

        dto = gql.RegisterUserRequestDto(
            email="test@example.com", password="pw", name="Test"
        )
        assert RegisterUser(session, user)(dto) is True

        with pytest.raises(ValueError):
            RegisterUser(session, user)(dto)

    def test_register_deactivated(self):
        config.clear()

        session = MockSession()
        user = None
        dto = gql.RegisterUserRequestDto(
            email="test@example.com", password="pw", name="Test"
        )

        with pytest.raises(ValueError):
            RegisterUser(session, user)(dto)


class TestLogin:
    def test_login_success(self):
        session = MockSession()
        user = None

        dto = gql.RegisterUserRequestDto(
            email="test@example.com", password="pw", name="Test"
        )
        assert RegisterUser(session, user)(dto) is True

        dto = gql.LoginRequestDto(email="test@example.com", password=dto.password)
        result = Login(session, user)(dto)
        assert hasattr(result, "token")
        assert isinstance(result.token, str)

    def test_login_wrong_password(self):
        session = MockSession()
        user = None

        dto = gql.RegisterUserRequestDto(
            email="test@example.com", password="pw", name="Test"
        )
        assert RegisterUser(session, user)(dto) is True

        dto = gql.LoginRequestDto(email="test@example.com", password="wrong")
        with pytest.raises(ValueError):
            Login(session, user)(dto)

    def test_login_nonexistent_user(self):
        session = MockSession()
        user = None
        dto = gql.LoginRequestDto(email="notfound@example.com", password="pw")
        with pytest.raises(ValueError):
            Login(session, user)(dto)

    def test_login_deactivated(self):
        config.clear()

        session = MockSession()
        user = None

        dto = gql.LoginRequestDto(email="test@example.com", password="pw")
        with pytest.raises(ValueError):
            Login(session, user)(dto)
