import typing
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from starlette.authentication import BaseUser

from .base import PropertyBag, UserID, WorkspaceID

if typing.TYPE_CHECKING:
    from .collection import CollectionID


@dataclass
class User(BaseUser, PropertyBag):
    id: UserID
    external_id: str
    name: str

    workspace: "Workspace"

    _is_authenticated: bool = field(default=False, init=False)

    @property
    def is_authenticated(self) -> bool:
        return self._is_authenticated

    def set_authenticated(self, val: bool):
        self._is_authenticated = val

    @property
    def display_name(self) -> str:
        return self.external_id

    @property
    def tutorial_state(self) -> str:
        return self.properties.get("tutorial_state", (None, "{}"))[1]

    @tutorial_state.setter
    def tutorial_state(self, val: str):
        self.properties["tutorial_state"] = (None, val)

    @property
    def last_contact(self) -> datetime:
        return datetime.fromisoformat(
            self.properties.get("last_contact", (None, "1943-02-22T00:00:00"))[1]
        )

    @last_contact.setter
    def last_contact(self, val: datetime):
        self.properties["last_contact"] = (None, val.isoformat())

    def __repr__(self) -> str:
        return f"User(id={self.id}, external_id={self.external_id})"

    def __hash__(self) -> int:
        return self.id.int


@dataclass(frozen=True)
class CollectionNotInWorkspaceException(Exception):
    collection_id: "CollectionID"

    def __repr__(self) -> str:
        return f"Collection with ID {self.collection_id} is not in your workspace"


@dataclass
class Workspace:
    id: WorkspaceID
    collection_ids: list["CollectionID"] = field(default_factory=list)

    def contains_collection(self, collection_id: "CollectionID") -> bool:
        return collection_id in self.collection_ids

    def add_collection(self, collection_id: "CollectionID") -> None:
        if not self.contains_collection(collection_id):
            self._add_collection(collection_id, 0)

    def _add_collection(self, collection_id: "CollectionID", position: int = 0) -> None:
        self.collection_ids.insert(position, collection_id)

    def remove_collection(self, collection_id: "CollectionID"):
        if not self.contains_collection(collection_id):
            raise CollectionNotInWorkspaceException(collection_id)

        self.collection_ids.remove(collection_id)

    def move_collection_after(
        self, collection_id: "CollectionID", ref: Optional["CollectionID"]
    ):
        if not self.contains_collection(collection_id):
            raise CollectionNotInWorkspaceException(collection_id)

        if ref is not None and not self.contains_collection(ref):
            raise CollectionNotInWorkspaceException(ref)

        self.remove_collection(collection_id)

        new_pos = 0
        if ref is not None:
            new_pos = self.collection_ids.index(ref) + 1

        self._add_collection(collection_id, new_pos)

    def __repr__(self) -> str:
        return f"Workspace(id={self.id}, collections={repr(self.collection_ids)})"
