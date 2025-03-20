from typing import Callable, cast

from sqlalchemy import event
from sqlalchemy.orm import Session as SQLSession
from sqlalchemy.orm import sessionmaker as sql_sessionmaker

import medconb.domain as d
from medconb.types import CodeRepository, sessionmaker

from . import ontology_orm, orm
from .cache import CachedCodeRepository, CachedPropertyRepository
from .orm import MappedCodelist, MappedPhenotype
from .repositories import CodelistRepository
from .repositories import CodeRepository as PGCodeRepository
from .repositories import (
    CollectionRepository,
    OntologyRepository,
    PhenotypeRepository,
    PropertyRepository,
    UserRepository,
)


class Session(SQLSession):
    """
    The custom session does two things:
      1. It adds access to the repositories for convenience,
      2. It assures the integrity of ContainerItem objects.

    About the second point:

    The domain model of containers and container items is too complex to
    map it with sqlalchemy inheritance capabilities (e.g. no multiple
    inheritance possible).
    In the domain model, container items (Codelist, Phenotype) store a
    reference to the container they are part of and a container stores
    references to its items. Further, we postulate that an item must not
    exist / is not in a valid state outside of a container.

    As we want to store only references, not the whole object, we break
    sqlalchemy's automatic resolver chain by using `ContainerItem` in
    the mapper. It stores reference information of the items, their
    containers and the items position in the container.

    Remark: when using "ContainerItem", the class from the mapper is
    being referred to. When using "container items", an actual domain
    object like a Codelist or Phenotype object are meant.

    The creation of new domain container items in userland now comes
    with two difficulties:
    The container items only have the property `container` which is
    a proxy to the `_container_item.container` and `_container_item`
    is a full ContainerItem object that only exists on the persistence
    level as there is no knowledge of the ContainerItem class. As the
    association_proxy used for `_container_item.container` does not
    support a creator function that knows about the parent object (we
    need that to set the id and type of the item), we handle the
    creation of the ContainerItem during the init event of the domain
    objects (see __init__) and prevent that the proxy ever needs to do
    that.
    Secondly, the backref of the ContainerItem needs to be handled. As
    we don't know what position in a container a container item has when
    it is created, we can't set `order` on creation. When that container
    item is added to a container, another ContainerItem is created on
    the side of the container (through the proxy on _items, see
    _ContainerItemAssociationList). In order to keep everything clean,
    we require
      * the container to be attached to the session and
      * the container item to be added to the container.
    Then the "real" ContainerItem which will be persisted is in the
    session. When now the container item with an incomplete
    ContainerItem gets attached to the session, we replace that
    incomplete ContainerItem with the one that already exists in the
    session. That happens via listening for "before_attach" on the
    session.
    """

    def __init__(
        self,
        code_repository: Callable[..., CodeRepository],
        property_repository: Callable[..., PropertyRepository],
        **kw
    ) -> None:
        super().__init__(**kw)
        self._code_repository = code_repository
        self._property_repository = property_repository

        event.listen(d.Codelist, "init", self.handle_domain_container_item_init)
        event.listen(d.Phenotype, "init", self.handle_domain_container_item_init)

        event.listen(self, "before_attach", self.handle_before_attach)

    def handle_pending_orm_container_item(
        session: SQLSession, obj: orm.ContainerItem
    ): ...

    @classmethod
    def handle_domain_container_item_init(
        cls, obj: MappedCodelist | MappedPhenotype, args: list, kwargs: dict
    ):
        """
        Correctly initializes the mapped property `_container_item` when
        a new Codelist or Phenotype is created in userland.
        After this point the object is ready to be added to a session
        in which the object was already added to a collection and thus
        the "real" ContainerItem already exists. Bringing these together
        to keep the session consistent is done in the before_attach
        handler `handle_before_attach`.

        See docs for Session.
        """
        id_ = kwargs.get("id") or args[0]
        container = kwargs.get("container") or args[5]

        assert isinstance(id_, (d.CodelistID, d.PhenotypeID))
        assert isinstance(container, d.ContainerSpec)

        obj._container_item = orm.ContainerItem(
            id=id_, type_=obj.type_, container=container
        )

    @classmethod
    def handle_before_attach(cls, session: SQLSession, obj):
        """
        Makes sure that incomplete ContainerItems on container items are
        replaced with their previously attached versions.

        See docs for Session.
        """
        if not isinstance(obj, (MappedCodelist | MappedPhenotype)):
            return

        obj._container_item = cast(orm.ContainerItem, obj._container_item)
        existing_item = session.get(
            orm.ContainerItem, (obj._container_item.id, obj._container_item.type_)
        )

        if existing_item is None:
            raise RuntimeError(
                "You must add a ContainerItem to a container before you attach it to"
                " the session."
            )

        obj._container_item = existing_item

    @property
    def user_repository(self) -> UserRepository:
        return UserRepository(self)

    @property
    def collection_repository(self) -> CollectionRepository:
        return CollectionRepository(self)

    @property
    def phenotype_repository(self) -> PhenotypeRepository:
        return PhenotypeRepository(self)

    @property
    def codelist_repository(self) -> CodelistRepository:
        return CodelistRepository(self)

    @property
    def ontology_repository(self) -> OntologyRepository:
        return OntologyRepository(self)

    @property
    def code_repository(self) -> CodeRepository:
        return self._code_repository(self)

    @property
    def property_repository(self) -> PropertyRepository:
        return self._property_repository(self)


def create_sessionmaker(
    engine_medconb, engine_ontology, cache_client=None
) -> tuple[sessionmaker, list[Callable]]:
    medconb_mappers = orm.start_mappers()
    ontology_mappers = ontology_orm.start_mappers()

    binds = {mp: engine_medconb for mp in medconb_mappers} | {
        mp: engine_ontology for mp in ontology_mappers
    }

    startup_hooks: list[Callable] = []

    init_sm = sql_sessionmaker(bind=engine_medconb, binds=binds)
    property_repo = CachedPropertyRepository(sm=init_sm)
    code_repo: Callable[..., CodeRepository] = PGCodeRepository

    if cache_client:
        code_repo = CachedCodeRepository(sm=init_sm, client=cache_client)
        startup_hooks.append(code_repo.warmup)

    sm = sql_sessionmaker(
        bind=engine_medconb,
        binds=binds,
        class_=Session,
        code_repository=code_repo,
        property_repository=property_repo,
    )

    return sm, startup_hooks
