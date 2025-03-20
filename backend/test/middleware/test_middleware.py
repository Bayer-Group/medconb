from unittest.mock import MagicMock

import confuse
import pytest

import medconb.domain as d
from medconb.domain import Collection, ItemType, Ontology, User
from medconb.middleware import AuthBackend, AzureADAuthenticator, DevAuthenticator
from medconb.types import Session

from ..helper import _c_id, _u_id


class TestDevAuthenticator:
    @pytest.fixture
    def config(self):
        config = confuse.Configuration("MedConB", __name__)
        config["token"] = "test_dev_token"
        config["user_id"] = str(_u_id(1))
        return config

    def test_success(self, config):
        init_session, conn_session = MagicMock(Session), MagicMock(Session)
        init_session.user_repository.get.return_value = User(_u_id(1), "", "name", None)
        conn_session.user_repository.get.return_value = User(_u_id(1), "", "name", None)

        authenticator = DevAuthenticator(config, init_session)
        authenticator.authenticate(conn_session, "test_dev_token")

        assert authenticator.user == conn_session.user_repository.get.return_value
        assert authenticator.credentials is not None
        assert authenticator.error is None

        conn_session.user_repository.get.assert_called_once_with(_u_id(1))

    def test_wrong_token(self, config):
        init_session, conn_session = MagicMock(Session), MagicMock(Session)

        authenticator = DevAuthenticator(config, init_session)
        authenticator.authenticate(conn_session, "wrong_token")

        assert authenticator.user is None
        assert authenticator.credentials is None
        assert authenticator.error is not None
        assert str(authenticator.error) == "Invalid Bearer token"

    def test_bad_config_user(self, config):
        init_session = MagicMock(Session)
        init_session.user_repository.get.return_value = None

        with pytest.raises(ValueError) as excinfo:
            DevAuthenticator(config, init_session)

        assert f"id '{_u_id(1)}' does not exist" in repr(excinfo.value)

    def test_forgot_call_authenticate(self, config):
        init_session = MagicMock(Session)

        authenticator = DevAuthenticator(config, init_session)

        with pytest.raises(Exception) as excinfo:
            authenticator.user
        assert "authenticate was not called" in repr(excinfo.value)

        with pytest.raises(Exception) as excinfo:
            authenticator.credentials
        assert "authenticate was not called" in repr(excinfo.value)

        with pytest.raises(Exception) as excinfo:
            authenticator.error
        assert "authenticate was not called" in repr(excinfo.value)


class TestAzureADAuthenticator:
    def test_bad_token(self):
        init_session = MagicMock(Session)
        conn_session = MagicMock(Session)

        config = confuse.Configuration("MedConB", __name__)
        config["tenant"] = "your-tenant-id"
        config["aud"] = "your-application-id"
        config["claims"] = [
            {"name": "azure_id", "mapped_to": "external_id"},
            {"name": "name", "mapped_to": "name"},
            {"name": "email", "mapped_to": "email"},
        ]

        authenticator = AzureADAuthenticator(config, init_session)
        authenticator.authenticate(conn_session, "foobar")

        assert authenticator.user is None
        assert authenticator.credentials is None
        assert authenticator.error is not None
        assert str(authenticator.error) == "Unable to decode Bearer token"

    def test_forgot_call_authenticate(self):
        init_session = MagicMock(Session)

        config = confuse.Configuration("MedConB", __name__)
        config["tenant"] = "your-tenant-id"
        config["aud"] = "your-application-id"
        config["claims"] = [
            {"name": "azure_id", "mapped_to": "external_id"},
            {"name": "name", "mapped_to": "name"},
            {"name": "email", "mapped_to": "email"},
        ]

        authenticator = AzureADAuthenticator(config, init_session)

        with pytest.raises(Exception) as excinfo:
            authenticator.user
        assert "authenticate was not called" in repr(excinfo.value)

        with pytest.raises(Exception) as excinfo:
            authenticator.credentials
        assert "authenticate was not called" in repr(excinfo.value)

        with pytest.raises(Exception) as excinfo:
            authenticator.error
        assert "authenticate was not called" in repr(excinfo.value)

    def test_load_existing_user(self):
        conn_session = MagicMock(Session)
        conn_session.user_repository.getByExternalID.return_value = User(
            id=_u_id(1), external_id="", name="name", workspace=None
        )

        config = confuse.Configuration("MedConB", __name__)
        config["tenant"] = "your-tenant-id"
        config["aud"] = "your-application-id"
        config["claims"] = [
            {"name": "azure_id", "mapped_to": "external_id"},
            {"name": "name", "mapped_to": "name"},
            {"name": "email", "mapped_to": "email"},
        ]

        authenticator = AzureADAuthenticator(config, MagicMock(Session))

        claims = {"azure_id": "XYZ", "name": "name", "email": "user@example.com"}
        got = authenticator._load_user(conn_session, claims)

        assert got == conn_session.user_repository.getByExternalID.return_value
        conn_session.user_repository.getByExternalID.assert_called_once_with("XYZ")

    def test_load_nonexisting_user(self):  # noqa: R901 complexity
        conn_session = MagicMock(Session)
        conn_session.user_repository.getByExternalID.return_value = None
        conn_session.user_repository.new_id.return_value = _u_id(1)
        conn_session.collection_repository.new_id.return_value = _c_id(99)
        conn_session.collection_repository.get.return_value = Collection(
            id=_c_id(99),
            name="",
            description="",
            item_type=ItemType.Codelist,
            item_ids=[],
            shared_with=set(),
            _owner_id=_u_id(1),
        )
        conn_session.ontology_repository.get_all.return_value = [
            Ontology("ICD-10-CM", []),
            Ontology("ICD-9-CM", []),
        ]

        conn_session.property_repository.get_all.return_value = [
            d.Property(
                id=3,
                name="Created",
                class_name=d.PropertyClass.Collection,
                dtype=d.PropertyDtype.Time,
                dtype_meta={},
                required=False,
                read_only=True,
            ),
            d.Property(
                id=4,
                name="Created By",
                class_name=d.PropertyClass.Collection,
                dtype=d.PropertyDtype.User,
                dtype_meta={},
                required=False,
                read_only=True,
            ),
            d.Property(
                id=5,
                name="Last Edited",
                class_name=d.PropertyClass.Collection,
                dtype=d.PropertyDtype.Time,
                dtype_meta={},
                required=False,
                read_only=True,
            ),
            d.Property(
                id=6,
                name="Last Edited By",
                class_name=d.PropertyClass.Collection,
                dtype=d.PropertyDtype.User,
                dtype_meta={},
                required=False,
                read_only=True,
            ),
        ]

        config = confuse.Configuration("MedConB", __name__)
        config["tenant"] = "your-tenant-id"
        config["aud"] = "your-application-id"
        config["claims"] = [
            {"name": "azure_id", "mapped_to": "external_id"},
            {"name": "name", "mapped_to": "name"},
            {"name": "email", "mapped_to": "email"},
        ]

        authenticator = AzureADAuthenticator(config, MagicMock(Session))

        claims = {"azure_id": "XYZ", "name": "name", "email": "user@example.com"}
        got = authenticator._load_user(conn_session, claims)

        assert got.id == conn_session.user_repository.new_id.return_value
        assert got.external_id == claims["azure_id"]
        assert got.name == claims["name"]

        assert len(got.workspace.collection_ids) > 0

        add_calls = conn_session.add.call_args_list
        cnt_added_user = sum([1 for c in add_calls if isinstance(c[0][0], User)])
        cnt_added_coll = sum([1 for c in add_calls if isinstance(c[0][0], Collection)])

        assert cnt_added_user == 1
        assert cnt_added_coll > 0

        conn_session.user_repository.new_id.assert_called_once()
        conn_session.collection_repository.new_id.assert_called()
        conn_session.ontology_repository.get_all.assert_called()


class TestAuthBackend:
    @pytest.mark.asyncio
    async def test_all_authenticators_called(self):
        class TestAuthenticator:
            def __init__(self):
                self.called = 0

            def authenticate(self, conn_session: Session, token: str):
                self.called += 1

            @property
            def error(self):
                return None

            @property
            def credentials(self):
                return "something not None"

            @property
            def user(self):
                return User(_u_id(1), "", "name", None)

        init_session = MagicMock(Session)

        conn = MagicMock()
        conn.headers.get.return_value = "Bearer foo"

        config = confuse.Configuration("MedConB", __name__)
        config["develop"]["token"] = "test_dev_token"
        config["develop"]["user_id"] = str(_u_id(1))

        backend = AuthBackend(config, init_session)

        auth1, auth2, auth3 = (
            TestAuthenticator(),
            TestAuthenticator(),
            TestAuthenticator(),
        )
        backend.authenticators = [auth1, auth2, auth3]

        await backend.authenticate(conn)

        assert auth1.called == 1
        assert auth2.called == 0  # auth2 is not called because auth1 already succeeded
        assert auth3.called == 0
        conn.headers.get.assert_called_once_with("Authorization", None)

    @pytest.mark.asyncio
    async def test_no_authorization_header(self):
        init_session = MagicMock(Session)

        conn = MagicMock()
        conn.headers.get.return_value = None

        config = confuse.Configuration("MedConB", __name__)
        config["develop"]["token"] = "test_dev_token"
        config["develop"]["user_id"] = str(_u_id(1))

        backend = AuthBackend(config, init_session)
        assert await backend.authenticate(conn) is None

        conn.headers.get.assert_called_once_with("Authorization", None)

    @pytest.mark.asyncio
    async def test_no_bearer_token(self):
        init_session = MagicMock(Session)

        conn = MagicMock()
        conn.headers.get.return_value = "Bärer foobar"

        config = confuse.Configuration("MedConB", __name__)
        config["develop"]["token"] = "test_dev_token"
        config["develop"]["user_id"] = str(_u_id(1))

        backend = AuthBackend(config, init_session)
        assert await backend.authenticate(conn) is None

        conn.headers.get.assert_called_once_with("Authorization", None)
