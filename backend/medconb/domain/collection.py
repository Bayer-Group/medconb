import enum
from dataclasses import KW_ONLY, dataclass, field
from typing import TYPE_CHECKING, Generic, TypeVar
from uuid import UUID

from .base import PUBLIC_USER_ID, PropertyBag
from .codelist import Codelist, CodelistID
from .container import ContainerType, OrderedContainer
from .phenotype import Phenotype, PhenotypeID

if TYPE_CHECKING:  # pragma: no cover
    from .base import UserID
    from .user import User


class CollectionID(UUID): ...


Phenotypish = PhenotypeID | Phenotype
Codelistish = CodelistID | Codelist


class CollectionVisibility(enum.IntEnum):
    Private = 1
    Shared = 2
    Public = 3


T = TypeVar("T", Phenotypish, Codelistish)


@dataclass
class Collection(OrderedContainer, PropertyBag, Generic[T]):
    _: KW_ONLY
    id: CollectionID
    name: str
    description: str
    shared_with: set["User"] = field(default_factory=set)
    _owner_id: "UserID"
    item_ids: list
    container_type: ContainerType = field(init=False, default=ContainerType.Collection)
    reference_id: CollectionID | None = None
    locked: bool = False

    @property
    def owner_id(self) -> "UserID":
        return self._owner_id

    def set_readers(self, users: list["User"]):
        self.shared_with = set(users)

    def __repr__(self) -> str:
        return (
            f"Collection(id={self.id}, name={self.name},"
            " item_type={self.item_type.name},"
            f" len={len(self.item_ids)}),"
            f" properties.len={len(self.properties)})"
        )


def collection_readable_by_user(c: Collection, u: "User") -> bool:
    return bool(
        {u.id for u in c.shared_with} & {u.id, PUBLIC_USER_ID}
    ) or u.workspace.contains_collection(c.id)


def transfer_ownership(
    collection: Collection, old_owner: "User", new_owner: "User"
) -> None:
    collection.shared_with.add(old_owner)
    collection.shared_with -= {new_owner}

    new_owner.workspace.add_collection(collection.id)
    old_owner.workspace.remove_collection(collection.id)
