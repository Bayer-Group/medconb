from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import IntEnum, auto
from typing import TYPE_CHECKING, Any, Callable, Optional, cast, overload

import medconb.domain as d
import medconb.graphql.types as gql

if TYPE_CHECKING:  # pragma: no cover
    from medconb.types import Session


class AccessLevel(IntEnum):
    Read = auto()
    ReadWrite = auto()


AccessCheckable = d.Collection | d.Phenotype | d.Codelist


class BaseInteractor(ABC):
    def __init__(self, session: "Session", user: "d.User") -> None:
        self.session = session
        self.user = user
        self.workspace = user.workspace
        self.code_repository = session.code_repository
        self.codelist_repository = session.codelist_repository
        self.collection_repository = session.collection_repository
        self.ontology_repository = session.ontology_repository
        self.phenotype_repository = session.phenotype_repository
        self.property_repository = session.property_repository
        self.user_repository = session.user_repository

    def is_readable_by_current_user(
        self, obj: d.Codelist | d.Phenotype | d.Collection
    ) -> bool:
        """
        Checks if a ContainerItem or a Collection is readable by the current sessions
        user.

        Not for future expansions: It assumes that there are no nested Collections.
        """
        root_collection = self._must_load_root_collection_of(obj)
        return d.collection_readable_by_user(root_collection, self.user)

    def is_writable_by_current_user(
        self, obj: d.Codelist | d.Phenotype | d.Collection
    ) -> bool:
        """
        Checks if a ContainerItem or a Collection is owned and thus writable by the
        current sessions user.

        Note for future expansions: It assumes that there are no nested Collections.
        """
        root_collection = self._must_load_root_collection_of(obj)
        return self.user.workspace.contains_collection(root_collection.id)

    def _must_get_collection_from_current_workspace(
        self, collection_id: d.CollectionID, type_: Optional[d.ItemType] = None
    ) -> d.Collection:
        if not self.workspace.contains_collection(collection_id):
            raise CollectionNotExistsException(collection_id)

        collection = self.collection_repository.get(collection_id)
        if collection is None:  # pragma: no cover
            # Here we know that the collection is in the users workspace,
            # so it must exist. Otherwise, something really bad happened.
            # This is not something that needs to be checked here, maybe
            # a function `must_get` on the repo makes sense.
            raise RuntimeError("Inconsistent State")

        if type_ and type_ != collection.item_type:
            raise CollectionNotExistsException(collection_id)

        return collection

    @overload
    def _must_load_container(
        self, container_info: d.CollectionID, *, filters: dict[str, Any] = {}
    ) -> d.Phenotype | d.Collection: ...  # pragma: no cover

    @overload
    def _must_load_container(
        self, container_info: d.PhenotypeID, *, filters: dict[str, Any] = {}
    ) -> d.Phenotype | d.Collection: ...  # pragma: no cover

    @overload
    def _must_load_container(
        self, container_info: "d.ContainerID", *, filters: dict[str, Any] = {}
    ) -> d.Phenotype | d.Collection: ...  # pragma: no cover

    @overload
    def _must_load_container(
        self, container_info: d.ContainerSpec, *, filters: dict[str, Any] = {}
    ) -> d.Phenotype | d.Collection: ...  # pragma: no cover

    def _must_load_container(
        self, container_info, *, filters={}
    ) -> d.Phenotype | d.Collection:
        """
        Retrieves a container object from persistence.

        The result can be restricted by `filter`.
        Possible values are:
          * container_type: d.ContainerType,
          * item_type: d.ItemType
        """
        container: d.OrderedContainer | None
        expected_type: Optional[d.ContainerType]

        match container_info:
            case d.ContainerSpec(type_=d.ContainerType.Collection):
                container_info.id = cast(d.CollectionID, container_info.id)
                container = self.collection_repository.get(container_info.id)
                expected_type = d.ContainerType.Collection
            case d.ContainerSpec(type_=d.ContainerType.Phenotype):
                container_info.id = cast(d.PhenotypeID, container_info.id)
                container = self.phenotype_repository.get(container_info.id)
                expected_type = d.ContainerType.Phenotype
            case d.CollectionID():
                container = self.collection_repository.get(container_info)
                expected_type = d.ContainerType.Collection
            case d.PhenotypeID():
                container = self.phenotype_repository.get(container_info)
                expected_type = d.ContainerType.Phenotype
            case _:  # possibly some untyped d.ContainerID
                expected_type = None
                container = self.collection_repository.get(container_info)
                if container is None:
                    container = self.phenotype_repository.get(container_info)

        container_id = cast(
            d.CollectionID | d.PhenotypeID,
            getattr(container_info, "id", container_info),
        )
        if container is None:
            raise ContainerNotExistsException(container_id, expected_type)

        t: Any = container.container_type
        if filters.get("container_type", t) != t:
            raise ContainerNotExistsException(container_id, expected_type)

        t = container.item_type
        if filters.get("item_type", t) != t:
            raise ContainerNotExistsException(container_id, expected_type)

        return container

    def _must_load_container_item(
        self, container: d.OrderedContainer, item_id: "d.ContainerItemID"
    ) -> d.ContainerItem:
        """
        Retrieves an item container object from persistence.
        """
        if not container.has(item_id):
            raise ItemNotExistsException(item_id, container.item_type)

        get_func: Callable
        match container.item_type:
            case d.ItemType.Codelist:
                get_func = self.codelist_repository.get
            case d.ItemType.Phenotype:
                get_func = self.phenotype_repository.get
            case _:
                raise NotImplementedError(
                    f"Container of type {container.item_type} is not supported"
                )

        item = get_func(item_id)

        if item is None:  # pragma: no cover
            raise ItemNotExistsException(item_id)

        return item

    def _identify_ref(
        self,
        position: gql.ReferencePosition,
        *,
        default_container: Optional[d.OrderedContainer] = None,
        item_type: Optional[d.ItemType] = None,
    ) -> tuple[d.OrderedContainer, Optional[d.ContainerItem]]:
        """
        Loads objects from persistence that define a reference position
        within the workspace tree. Concretely it returns the referenced
        container and container item (may be
        None).

        If a ref_item is returned, it is assured to be in the
        ref_container.

        By using the _must_* loader, this raises an error if any of the
        requested entities are not accessible.

        When `item_type` is given, it only returns a container if its
        items are of that type and raises an error otherwise.
        """
        if position.container_id is None:
            if default_container is None:
                raise ValueError("A reference container needs to be given")
            container = default_container
        else:
            container = self._must_load_container(
                position.container_id,
                filters={"item_type": item_type} if item_type else {},
            )

        item: d.ContainerItem | None = None
        if position.item_id is not None:
            item = self._must_load_container_item(container, position.item_id)

        return container, item

    def _must_load_root_collection_of(
        self, obj: d.Codelist | d.Phenotype | d.Collection
    ) -> d.Collection:
        curr_obj: d.Codelist | d.Phenotype | d.Collection = obj
        while not isinstance(curr_obj, d.Collection):
            curr_obj = self._must_load_container(curr_obj.container)
            assert isinstance(curr_obj, d.Phenotype | d.Collection)

        return cast(d.Collection, curr_obj)


class InteractorException(Exception, ABC):
    @abstractmethod
    def __repr__(self) -> str:  # pragma: no cover
        ...


@dataclass(frozen=True)
class UserNotExistsException(InteractorException):
    user_id: "d.UserID"

    def __repr__(self) -> str:
        return f"User with ID {self.user_id} does not exist."


@dataclass(frozen=True)
class CollectionNotExistsException(InteractorException):
    collection_id: "d.CollectionID"

    def __repr__(self) -> str:
        return (
            f"Collection with ID {self.collection_id} "
            "does not exist or is not in your workspace"
        )


@dataclass(frozen=True)
class ContainerNotExistsException(InteractorException):
    container_id: "d.ContainerID"
    container_type: "Optional[d.ContainerType]"

    def __repr__(self) -> str:
        return (
            f"Container of type {self.container_type} with ID"
            f" {self.container_id} does not exist or is not in your"
            " workspace"
        )


@dataclass(frozen=True)
class ItemNotExistsException(InteractorException):
    item_id: "d.CodelistID | d.PhenotypeID"
    type_: Optional[d.ItemType] = None

    def __repr__(self) -> str:
        return (
            f"Item of type {self.type_} with ID {self.item_id}"
            " does not exist or is not accessible"
        )


@dataclass(frozen=True)
class CodelistNotExistsException(InteractorException):
    codelist_id: "d.CodelistID"

    def __repr__(self) -> str:
        return (
            f"Codelist with ID {self.codelist_id} "
            "does not exist or is not accessible"
        )


@dataclass(frozen=True)
class PhenotypeNotExistsException(InteractorException):
    phenotype_id: "d.PhenotypeID"

    def __repr__(self) -> str:
        return (
            f"Phenotype with ID {self.phenotype_id} "
            "does not exist or is not accessible"
        )
