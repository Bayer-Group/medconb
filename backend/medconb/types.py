from typing import TYPE_CHECKING, Any, ContextManager, Optional, Protocol

import medconb.domain as d

if TYPE_CHECKING:
    from plyse import Query


class UserRepository(Protocol):  # pragma: no cover
    def get(self, user_id: d.UserID) -> Optional[d.User]: ...

    def get_all(
        self, user_ids: list[d.UserID] | None = None, include_system: bool = False
    ) -> list[d.User]: ...

    def getByExternalID(self, external_id: str) -> Optional[d.User]: ...

    def new_id(self) -> d.UserID: ...

    def new_workspace_id(self) -> d.WorkspaceID: ...

    def lock(self) -> None: ...


class CollectionRepository(Protocol):  # pragma: no cover
    def get(self, collection_id: d.CollectionID) -> Optional[d.Collection]: ...

    def get_all(self, collection_ids: list[d.CollectionID]) -> list[d.Collection]: ...

    def get_shared_with(self, user: d.User) -> list[d.Collection]:
        """Returns all Collections that are shared with `user`."""

    def new_id(self) -> d.CollectionID: ...

    def search(
        self,
        query: "Query",
        item_type: d.ItemType,
        user_id: d.UserID,
        page_size: int = 100,
        start_cursor: Optional[d.CollectionID] = None,
    ) -> tuple[list[d.Collection], int]: ...


class PropertyRepository(Protocol):  # pragma: no cover
    def get(self, property_id: d.PropertyID) -> Optional[d.Property]: ...

    def get_all(self, class_: d.PropertyClass | None) -> list[d.Property]: ...


class PhenotypeRepository(Protocol):  # pragma: no cover
    def get(self, phenotype_id: d.PhenotypeID) -> Optional[d.Phenotype]: ...

    def get_by(self, property: str, value: Any) -> list[d.Phenotype]: ...

    def get_all(self, phenotype_id: list[d.PhenotypeID]) -> list[d.Phenotype]: ...

    def delete(self, phenotype_id: d.PhenotypeID) -> None: ...

    def new_id(self) -> d.PhenotypeID: ...

    def search(
        self,
        query: "Query",
        user_id: d.UserID,
        page_size: int = 100,
        start_cursor: Optional[d.PhenotypeID] = None,
    ) -> tuple[list[d.Phenotype], int]: ...


class CodelistRepository(Protocol):  # pragma: no cover
    def get(self, codelist_id: d.CodelistID) -> Optional[d.Codelist]: ...

    def get_by(self, property: str, value: Any) -> list[d.Codelist]: ...

    def get_all(self, codelist_ids: list[d.CodelistID]) -> list[d.Codelist]: ...

    def delete(self, codelist_id: d.CodelistID) -> None: ...

    def new_id(self) -> d.CodelistID: ...

    def search(
        self,
        query: "Query",
        user_id: d.UserID,
        page_size: int = 100,
        start_cursor: Optional[d.CodelistID] = None,
    ) -> tuple[list[d.Codelist], int]: ...


class OntologyRepository(Protocol):  # pragma: no cover
    def get(self, ontology_id: str) -> Optional[d.Ontology]: ...

    def get_all(self, ids_subset: Optional[list[str]] = None) -> list[d.Ontology]: ...


class CodeRepository(Protocol):  # pragma: no cover
    def get(self, code_id: int) -> Optional[d.Code]: ...

    def get_all(self, code_ids: list[int]) -> list[d.Code]: ...

    def find_codes(
        self, codes: list[str], ontology_id: str | None = None
    ) -> dict[str, int | None]: ...

    def search_codes(
        self, query_data: d.QueryData, ontology_id: str
    ) -> list[d.Code]: ...


class Session(ContextManager, Protocol):  # pragma: no cover
    @property
    def user_repository(self) -> UserRepository: ...

    @property
    def collection_repository(self) -> CollectionRepository: ...

    @property
    def phenotype_repository(self) -> PhenotypeRepository: ...

    @property
    def codelist_repository(self) -> CodelistRepository: ...

    @property
    def ontology_repository(self) -> OntologyRepository: ...

    @property
    def code_repository(self) -> CodeRepository: ...

    @property
    def property_repository(self) -> PropertyRepository: ...

    def __enter__(self) -> "Session": ...

    def commit(self) -> None: ...

    def add(self, o) -> None: ...

    def delete(self, o) -> None: ...


class sessionmaker(Protocol):  # pragma: no cover
    def __call__(self, **kwds: Any) -> Session: ...
