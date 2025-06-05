from abc import ABC
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING

import jwt
from argon2 import PasswordHasher

import medconb.domain as d
import medconb.graphql.types as gql
from medconb.config import config

if TYPE_CHECKING:  # pragma: no cover
    from medconb.types import Session


class PublicInteractor(ABC):
    def __init__(self, session: "Session", user: "d.User") -> None:
        self.session = session
        self.code_repository = session.code_repository
        self.codelist_repository = session.codelist_repository
        self.collection_repository = session.collection_repository
        self.ontology_repository = session.ontology_repository
        self.phenotype_repository = session.phenotype_repository
        self.property_repository = session.property_repository
        self.user_repository = session.user_repository


class RegisterUser(PublicInteractor):
    """
    Registers a new User.
    """

    def __call__(self, dto: gql.RegisterUserRequestDto) -> bool:
        if not config["auth"]["password"].exists():
            raise ValueError("Registration is deactivated")
        if not (
            config["auth"]["password"]["secret"].exists()
            and config["auth"]["password"]["secret"].get(str)
        ):
            raise ValueError("Registration is deactivated")

        if not dto.email or self.user_repository.get_by_email(dto.email) is not None:
            raise ValueError("Registration failed.")

        ph = PasswordHasher()
        hashed_pw = ph.hash(dto.password)

        user = d.User(
            id=self.user_repository.new_id(),
            email=dto.email,
            password_hash=hashed_pw,
            external_id="password",
            name=dto.name,
            workspace=d.Workspace(id=self.user_repository.new_workspace_id()),
        )

        self.session.add(user)
        return True


class Login(PublicInteractor):
    """
    Verifies the log in credentials and returns a new auth token.
    """

    def __call__(self, dto: gql.LoginRequestDto) -> gql.TokenPayloadResponseDto:
        if not config["auth"]["password"].exists():
            raise ValueError("Password based Login is deactivated.")
        if not (
            config["auth"]["password"]["secret"].exists()
            and config["auth"]["password"]["secret"].get(str)
        ):
            raise ValueError("Password based Login is deactivated")

        user = self.user_repository.get_by_email(dto.email)
        if not (user and user.password_hash):
            raise ValueError("Login failed.")

        ph = PasswordHasher()
        try:
            ph.verify(user.password_hash, dto.password)
        except Exception:
            raise ValueError("Login failed.")

        if ph.check_needs_rehash(user.password_hash):
            user.password_hash = ph.hash(dto.password)

        secret = config["auth"]["password"]["secret"].get(str)
        payload = {
            "sub": str(user.id),
            "exp": datetime.now(timezone.utc) + timedelta(hours=24),
            "name": user.name,
        }
        token = jwt.encode(payload, secret, algorithm="HS256")
        return gql.TokenPayloadResponseDto(token=token)
