import sys
from dataclasses import dataclass
from typing import Any, Optional, Protocol, Union, cast, runtime_checkable

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Table,
    TypeDecorator,
    UniqueConstraint,
    inspect,
    select,
    util,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.ext.associationproxy import (
    AssociationProxy,
    AssociationProxyInstance,
    _AssociationList,
    _CreatorProtocol,
    _lazy_collection,
    _LazyCollectionProtocol,
    association_proxy,
)
from sqlalchemy.ext.mutable import MutableDict, MutableList, MutableSet
from sqlalchemy.ext.orderinglist import ordering_list
from sqlalchemy.orm import (
    Mapped,
    column_property,
    composite,
    foreign,
    registry,
    relationship,
)
from sqlalchemy.orm.exc import _safe_cls_name
from sqlalchemy.orm.session import object_session

import medconb.domain as d

_UNDER_TEST = "unittest" in sys.modules


mapper_registry = registry()


class PropertyBagType(TypeDecorator[dict[str, tuple[Optional[d.PropertyID], str]]]):
    """
    Converts the PropertyBag dict stored as JSONB such that the keys
    are converted from string to PropertyID (int).
    The other way around (int to str) is natively supported.
    """

    impl = JSONB

    cache_ok = False

    def process_result_value(
        self, value: Optional[Any], dialect
    ) -> dict[str, tuple[Optional[d.PropertyID], str]]:
        value_ = cast(dict[str, tuple[Optional[d.PropertyID], str]], value)
        return {
            name: (d.PropertyID(id_) if id_ else None, val)
            for name, (id_, val) in value_.items()
        }


@dataclass
class ContainerItem:
    id: d.PhenotypeID | d.CodelistID
    type_: d.ItemType
    container: d.ContainerSpec
    order: Optional[int] = None  # only None if not added to container yet


class _ContainerItemAssociationList(_AssociationList[d.PhenotypeID | d.CodelistID]):
    def __init__(
        self,
        lazy_collection: _LazyCollectionProtocol[d.PhenotypeID | d.CodelistID],
        creator: _CreatorProtocol,
        value_attr: str,
        parent: AssociationProxyInstance[d.PhenotypeID | d.CodelistID],
    ) -> None:
        if parent.parent.creator:
            raise ValueError("Passing a creator is not supported.")

        collection_class = util.duck_type_collection(lazy_collection())

        if parent.parent.getset_factory:
            getter, setter = parent.parent.getset_factory(collection_class, parent)
        else:
            getter, setter = parent.parent._default_getset(collection_class)

        super().__init__(
            lazy_collection=lazy_collection,
            creator=creator,
            getter=getter,
            setter=setter,
            parent=parent,
        )
        self.value_attr = value_attr

    def _create(self, item_id: d.PhenotypeID | d.CodelistID) -> Any:
        """
        We use the fact that the default implementation of a
        _LazyCollectionProtocol (class _lazy_collection) stores the
        reference to the object this proxy sits on in the attribute
        `parent`.
        """
        assert isinstance(self.lazy_collection, _lazy_collection)
        container: d.OrderedContainer = self.lazy_collection.parent
        match container:
            case d.Collection():
                pass
            case d.Phenotype():
                pass
            case _:
                raise ValueError(
                    "This association proxy only supports objects of type "
                    + _safe_cls_name(d.Collection)
                    + " or "
                    + _safe_cls_name(d.Phenotype)
                )

        return ContainerItem(
            id=item_id,
            type_=container.item_type,
            container=container.to_spec(),
        )

    def __delitem__(self, index: Union[slice, int]) -> None:
        if not isinstance(index, slice):
            item = self.col[index]
            if session := object_session(item):
                session.delete(item)
            elif not _UNDER_TEST:
                raise RuntimeError("No session found for container item {item}")
        else:
            for item in self.col[index]:
                if session := object_session(item):
                    session.delete(item)
                elif not _UNDER_TEST:
                    raise RuntimeError("No session found for container item {item}")

        del self.col[index]

    def remove(self, value: d.PhenotypeID | d.CodelistID) -> None:
        for i, val in enumerate(self):
            if val == value:
                item = self.col[i]
                if session := object_session(item):
                    session.delete(item)
                elif not _UNDER_TEST:
                    raise RuntimeError("No session found for container item {item}")
                del item
                return
        raise ValueError("value not in list")

    def clear(self) -> None:
        del self[0 : len(self.col)]


user = Table(
    "user",
    mapper_registry.metadata,
    Column("id", UUID, primary_key=True),
    Column("external_id", String, nullable=True),
    Column("name", String, nullable=False),
    Column("properties", MutableDict.as_mutable(PropertyBagType), nullable=False),  # type: ignore[arg-type] # noqa
)

workspace = Table(
    "workspace",
    mapper_registry.metadata,
    Column("id", UUID, primary_key=True),
    Column("user_id", UUID, ForeignKey("user.id")),
    Column("collection_ids", MutableList.as_mutable(ARRAY(UUID)), nullable=False),
)

container_item = Table(
    "container_item",
    mapper_registry.metadata,
    Column("id", UUID, primary_key=True),
    Column("type_", Enum(d.ItemType), primary_key=True),
    Column("order", Integer, nullable=False),
    Column("container_type", Enum(d.ContainerType), nullable=False),
    Column("container_id", UUID, nullable=False),
)

collection = Table(
    "collection",
    mapper_registry.metadata,
    Column("id", UUID, primary_key=True),
    Column("name", String, nullable=False),
    Column("description", String, nullable=False),
    Column("item_type", Enum(d.ItemType), nullable=False),
    Column("properties", MutableDict.as_mutable(PropertyBagType), nullable=False),  # type: ignore[arg-type] # noqa
    Column("reference_id", ForeignKey("collection.id"), nullable=True),
    Column("locked", Boolean, nullable=False),
)

phenotype = Table(
    "phenotype",
    mapper_registry.metadata,
    Column("id", ForeignKey("container_item.id"), primary_key=True),
    Column("name", String, nullable=False),
    Column("medical_description", String, nullable=False),
    Column("operational_description", String, nullable=False),
    Column("properties", MutableDict.as_mutable(PropertyBagType), nullable=False),  # type: ignore[arg-type] # noqa
    Column("reference_id", ForeignKey("phenotype.id"), nullable=True),
)

share = Table(
    "share",
    mapper_registry.metadata,
    Column("user_id", ForeignKey("user.id"), primary_key=True),
    Column("collection_id", ForeignKey("collection.id"), primary_key=True),
    UniqueConstraint("user_id", "collection_id"),
)

codelist = Table(
    "codelist",
    mapper_registry.metadata,
    Column("id", ForeignKey("container_item.id"), primary_key=True),
    Column("name", String, nullable=False),
    Column("description", String, nullable=False),
    Column("reference_id", ForeignKey("codelist.id"), nullable=True),
    Column("transient_commit_id", ForeignKey("commit.id"), nullable=True),
)

commit = Table(
    "commit",
    mapper_registry.metadata,
    Column("id", Integer, primary_key=True),
    Column("codelist_id", ForeignKey("codelist.id"), nullable=True),
    Column("author_id", UUID, nullable=False),
    Column("created_at", DateTime, nullable=False),
    Column("message", String, nullable=False),
    Column("position", Integer, nullable=True),
)

property_ = Table(
    "property",
    mapper_registry.metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("class_name", Enum(d.PropertyClass), nullable=False),
    Column("dtype", Enum(d.PropertyDtype), nullable=False),
    Column("dtype_meta", JSONB, nullable=False),
    Column("required", Boolean, nullable=False),
    Column("read_only", Boolean, nullable=False),
)


class MutableSetOfCodeIds(d.SetOfCodeIds, MutableSet):  # type: ignore
    """
    MutableSetOfCodeIds wraps SetOfCodeIds to be able to be written back
    to the database. The order of inheritance is important!
    It first needs to use the functionality of SetOfCodeIds which does
    the business logic and then uses super(). That then (as defined by
    the mro) next uses the MutableSet to do the sqlalchemy magic.
    """

    @classmethod
    def coerce(cls, index, value):
        """Convert list to instance of this class or default."""
        if not isinstance(value, cls):
            if isinstance(value, list):
                return cls(value)
            return MutableSet.coerce(index, value)
        else:
            return value


changeset = Table(
    "changeset",
    mapper_registry.metadata,
    Column("id", Integer, primary_key=True),
    Column("commit_id", ForeignKey("commit.id"), nullable=False),
    Column("ontology_id", String, nullable=False),
    Column(
        "code_ids_added", MutableSetOfCodeIds.as_mutable(ARRAY(Integer)), nullable=False
    ),
    Column(
        "code_ids_removed",
        MutableSetOfCodeIds.as_mutable(ARRAY(Integer)),
        nullable=False,
    ),
)


def start_mappers() -> list[Any]:
    mappers = []

    mapper = inspect(d.User, False) or mapper_registry.map_imperatively(
        d.User,
        user,
        properties={"workspace": relationship(d.Workspace, uselist=False)},
    )
    mappers.append(mapper)

    mapper = inspect(d.Workspace, False) or mapper_registry.map_imperatively(
        d.Workspace, workspace
    )
    mappers.append(mapper)

    mapper = inspect(ContainerItem, False) or mapper_registry.map_imperatively(
        ContainerItem,
        container_item,
        properties={
            "container": composite(
                d.ContainerSpec,
                container_item.c.container_type,
                container_item.c.container_id,
            )
        },
    )
    mappers.append(mapper)

    d.Collection.item_ids = association_proxy(  # type: ignore[assignment]
        "_items", "id", proxy_factory=_ContainerItemAssociationList
    )
    mapper = inspect(d.Collection, False) or mapper_registry.map_imperatively(
        d.Collection,
        collection,
        properties={
            "_items": relationship(
                ContainerItem,
                primaryjoin=collection.c.id == foreign(container_item.c.container_id),
                order_by=container_item.c.order,
                collection_class=ordering_list("order"),
                overlaps="_items",
                cascade="all, delete-orphan",
            ),
            "shared_with": relationship(
                d.User,
                collection_class=set,
                secondary=share,
            ),
            "_owner_id": column_property(
                select(workspace.c.user_id)
                .where(workspace.c.collection_ids.any(collection.c.id))
                .scalar_subquery()
            ),
        },
    )
    mappers.append(mapper)

    mapper = inspect(d.Property, False) or mapper_registry.map_imperatively(
        d.Property,
        property_,
    )
    mappers.append(mapper)

    def raise_creator():
        raise RuntimeError(
            "Creation of ContainerItem has to be handled by the parent object"
        )

    d.Phenotype.item_ids = association_proxy(  # type: ignore[assignment,misc]
        "_items", "id", proxy_factory=_ContainerItemAssociationList
    )
    d.Phenotype.container = association_proxy(  # type: ignore[assignment]
        "_container_item", "container", creator=raise_creator
    )
    mapper = inspect(d.Phenotype, False) or mapper_registry.map_imperatively(
        d.Phenotype,
        phenotype,
        properties={
            "_container_item": relationship(ContainerItem),
            "_items": relationship(
                ContainerItem,
                primaryjoin=phenotype.c.id == foreign(container_item.c.container_id),
                lazy="selectin",
                order_by=container_item.c.order,
                collection_class=ordering_list("order"),
                overlaps="_items",
                cascade="all, delete-orphan",
            ),
        },
    )
    mappers.append(mapper)

    d.Codelist.container = association_proxy(  # type: ignore[assignment]
        "_container_item", "container", creator=raise_creator
    )
    mapper = inspect(d.Codelist, False) or mapper_registry.map_imperatively(
        d.Codelist,
        codelist,
        properties={
            "_container_item": relationship(ContainerItem),
            "commits": relationship(
                d.Commit,
                foreign_keys=[commit.c.codelist_id],
                order_by=commit.c.position,
                collection_class=ordering_list("position"),
                cascade="all, delete-orphan",
            ),
            "transient_commit": relationship(
                d.Commit,
                foreign_keys=[codelist.c.transient_commit_id],
                single_parent=True,
                lazy="joined",
                cascade="all, delete-orphan",
            ),
        },
    )
    mappers.append(mapper)

    mapper = inspect(d.Commit, False) or mapper_registry.map_imperatively(
        d.Commit,
        commit,
        properties={
            "changesets": relationship(
                d.Changeset,
                order_by=changeset.c.ontology_id,
                lazy="joined",
                cascade="all, delete-orphan",
            )
        },
    )
    mappers.append(mapper)

    mapper = inspect(d.Changeset, False) or mapper_registry.map_imperatively(
        d.Changeset, changeset
    )
    mappers.append(mapper)

    return mappers


@runtime_checkable
class MappedCodelist(Protocol):
    _container_item: AssociationProxy["ContainerItem"]
    type_: d.ItemType


@runtime_checkable
class MappedPhenotype(Protocol):
    _container_item: AssociationProxy["ContainerItem"]
    type_: d.ItemType
    _items: Mapped[list["ContainerItem"]]


@runtime_checkable
class MappedCollection(Protocol):
    _items: Mapped[list["ContainerItem"]]
