import logging
from typing import (
    Any,
    Generic,
    Iterable,
    Optional,
    Protocol,
    Type,
    TypeVar,
    cast,
    runtime_checkable,
)

from ariadne.exceptions import HttpBadRequestError
from ariadne.types import GraphQLResolveInfo
from graphql import FieldNode, SelectionNode
from pydantic import BaseModel

import medconb.domain as d
from medconb.interactors import InteractorException
from medconb.types import Session

logger = logging.getLogger(__name__)

T_in = TypeVar("T_in", bound=Type[BaseModel] | None, contravariant=True)
T_out = TypeVar("T_out", covariant=True)
T_obj = TypeVar("T_obj", contravariant=True)


class InteractorInit(Protocol):  # pragma: no cover
    def __init__(self, session: Session, user: d.User) -> None: ...


@runtime_checkable
class DTOInteractor(InteractorInit, Protocol[T_in, T_out]):  # pragma: no cover
    def __call__(self, /, dto: T_in) -> T_out: ...


@runtime_checkable
class DTOLessInteractor(InteractorInit, Protocol[T_out]):  # pragma: no cover
    def __call__(self) -> T_out: ...


@runtime_checkable
class NeedsParent(Protocol[T_obj]):  # pragma: no cover
    def set_parent(self, obj: T_obj) -> None: ...


Interactor = DTOInteractor | DTOLessInteractor


class InteractorResolver(Generic[T_in, T_out, T_obj]):
    def __init__(
        self, interactor: Type[Interactor], parent_type: Optional[T_obj] = None
    ):
        self.interactor = interactor
        self.parent_type = parent_type

    def __call__(
        self, obj: Any, info: GraphQLResolveInfo, dto: T_in | None = None
    ) -> T_out:
        scope = info.context["request"].scope
        session: Session = scope["db_session"]
        user: d.User = scope["user"]

        try:
            i8r = self.interactor(session, user)

            if isinstance(i8r, NeedsParent):
                i8r.set_parent(obj)

            if dto is None:
                i8r = cast(DTOLessInteractor, i8r)
                res = i8r()
            else:
                i8r = cast(DTOInteractor, i8r)
                res = i8r(dto=dto)

            session.commit()

            return res
        except InteractorException as e:
            raise HttpBadRequestError(repr(e)) from e


def _get_field_nodes(fields: Iterable[SelectionNode]) -> list[FieldNode]:
    return [node for node in fields if isinstance(node, FieldNode)]


def get_sub_fields(info: "GraphQLResolveInfo") -> list[str]:
    if len(info.field_nodes) != 1:
        raise ValueError("Expected exactly one field node")

    node = info.field_nodes[0]

    if not node.selection_set:
        return []

    return [
        i.name.value
        for i in _get_field_nodes(node.selection_set.selections)
        if i.name.value != "__typename"
    ]
