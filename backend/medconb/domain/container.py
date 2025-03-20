import enum
from dataclasses import KW_ONLY, dataclass, field
from typing import (
    TYPE_CHECKING,
    Generic,
    NewType,
    Optional,
    Protocol,
    TypeAlias,
    TypeVar,
    overload,
    runtime_checkable,
)
from uuid import UUID

if TYPE_CHECKING:  # pragma: no cover
    from .codelist import Codelist, CodelistID
    from .collection import Collection, CollectionID
    from .phenotype import Phenotype, PhenotypeID

    ContainerID: TypeAlias = PhenotypeID | CollectionID
    ContainerItemID: TypeAlias = CodelistID | PhenotypeID
    Phenotypish: TypeAlias = PhenotypeID | Phenotype
    Codelistish: TypeAlias = CodelistID | Codelist


ItemID = NewType("ItemID", UUID)


class ContainerType(enum.IntEnum):
    Collection = 1
    Phenotype = 2


class ItemType(enum.IntEnum):
    Phenotype = 1
    Codelist = 2


@dataclass
class ContainerSpec:
    type_: ContainerType
    id: "ContainerID"


@runtime_checkable
class ContainerItem(Protocol):  # pragma: no cover
    @property
    def id(self) -> UUID: ...

    @property
    def container(self) -> ContainerSpec: ...

    @property
    def type_(self) -> ItemType: ...


T = TypeVar("T", bound=ContainerType)
TI = TypeVar("TI", bound=ItemType)


@dataclass
class OrderedContainer(Generic[T, TI]):
    _: KW_ONLY
    id: "ContainerID"
    container_type: ContainerType
    item_type: ItemType
    item_ids: list[TI] = field(default_factory=list)

    def to_spec(self) -> ContainerSpec:
        return ContainerSpec(type_=self.container_type, id=self.id)

    @overload
    def __contains__(self, item: "Phenotypish") -> bool: ...  # pragma: no cover

    @overload
    def __contains__(self, item: "Codelistish") -> bool: ...  # pragma: no cover

    def __contains__(self, item):
        return self.has(item)

    @overload
    def has(self, item: "Phenotypish") -> bool: ...  # pragma: no cover

    @overload
    def has(self, item: "Codelistish") -> bool: ...  # pragma: no cover

    def has(self, item):
        if hasattr(item, "id"):
            item = item.id

        return item in self.item_ids

    @overload
    def add_or_move_item_after(
        self,
        item_id: "CodelistID",
        ref_item: Optional["CodelistID"] = None,
    ): ...  # pragma: no cover

    @overload
    def add_or_move_item_after(
        self,
        item_id: "PhenotypeID",
        ref_item: Optional["PhenotypeID"] = None,
    ): ...  # pragma: no cover

    @overload
    def add_or_move_item_after(
        self,
        item_id: "CodelistID | PhenotypeID",
        ref_item: Optional["CodelistID | PhenotypeID"] = None,
    ): ...  # pragma: no cover

    def add_or_move_item_after(self, item_id, ref_item=None):
        """
        Add the item `item_id` to this collection.

        If `ref_cl` is None, the item is added as first position,
        otherwise it is positioned below `ref_cl`.
        """
        if ref_item is not None and ref_item not in self.item_ids:
            raise ValueError(
                "You are trying to add the item. However, "
                "`ref_cl` must be None or an existing item in "
                "this collection"
            )

        self.remove_item(item_id)

        new_pos = 0
        if ref_item is not None:
            new_pos = self.item_ids.index(ref_item) + 1

        self._add_item_at(item_id, new_pos)

    @overload
    def _add_item_at(
        self, item_id: "CodelistID", position: int = 0
    ) -> None: ...  # pragma: no cover

    @overload
    def _add_item_at(
        self, item_id: "PhenotypeID", position: int = 0
    ) -> None: ...  # pragma: no cover

    def _add_item_at(self, item_id, position=0):
        self.item_ids.insert(position, item_id)

    @overload
    def remove_item(self, item_id: "Codelistish") -> None: ...  # pragma: no cover

    @overload
    def remove_item(self, item_id: "Phenotypish") -> None: ...  # pragma: no cover

    def remove_item(self, item_id):
        if hasattr(item_id, "id"):
            item_id = item_id.id

        if item_id in self:
            self._remove_item(item_id)

    @overload
    def _remove_item(self, item_id: "CodelistID") -> None: ...  # pragma: no cover

    @overload
    def _remove_item(self, item_id: "PhenotypeID") -> None: ...  # pragma: no cover

    def _remove_item(self, item_id):
        if item_id in self.item_ids:
            self.item_ids.remove(item_id)


def add_or_move_item(  # noqa R901 - too complex
    container: Optional["Collection | Phenotype"],
    item: "Codelist | Phenotype",
    ref_container: "Collection | Phenotype",
    ref_item: Optional["Codelist | Phenotype"],
) -> None:
    """
    `container` is the current container that contains the
    `item`. It can be None in case the `item` is being created.
    `ref_container` is the container the `item` shall be
    added to. `ref_item` defines the relative position of the
    `item` and must be a child of `ref_container`.

    The positioning then covers these two cases:

    The `item` is added to `ref_container`
      * in first position if `ref_item` is None,
      * positioned after `ref_item` otherwise.
    """
    if item.type_ != ref_container.item_type:
        raise ValueError(
            f"Can not add item '{item.id}' of type {item.type_.name} into collection"
            f" '{ref_container.id}' which contains items of type"
            f" {ref_container.item_type.name}"
        )

    if item == ref_item:
        raise ValueError("Can not move item after itself")

    if ref_item and not ref_container.has(ref_item):
        raise ValueError("Given ref_container does not contain given ref_item")

    if container is not None:
        if not container.has(item):
            raise ValueError("Given container does not contain given item")

        container.remove_item(item)

    if ref_item is None:
        ref_container.add_or_move_item_after(item.id)
    else:
        ref_container.add_or_move_item_after(item.id, ref_item=ref_item.id)

    item.container = ref_container.to_spec()
