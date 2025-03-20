from dataclasses import dataclass
from typing import Any, Literal, Optional
from uuid import UUID

from pydantic import (
    BaseModel,
    Field,
    GetPydanticSchema,
    PositiveInt,
    field_validator,
    model_validator,
)
from typing_extensions import Annotated

import medconb.domain as d

HandleAsUUID = GetPydanticSchema(lambda _s, h: h(UUID))
HandleAsInt = GetPydanticSchema(lambda _s, h: h(int))

CollectionID = Annotated[d.CollectionID, HandleAsUUID]
PhenotypeID = Annotated[d.PhenotypeID, HandleAsUUID]
CodelistID = Annotated[d.CodelistID, HandleAsUUID]
UserID = Annotated[d.UserID, HandleAsUUID]
PropertyID = Annotated[d.PropertyID, HandleAsInt]


class ReferencePosition(BaseModel):
    container_id: Optional[CollectionID | PhenotypeID] = None
    item_id: Optional[CodelistID | PhenotypeID] = None


class OntologyRequestDto(BaseModel):
    name: str


class CodeRequestDto(BaseModel):
    id: int


class CodesRequestDto(BaseModel):
    ids: list[int]


class PagedCodesDto(BaseModel):
    page_size: int = Field(gt=0, le=100, default=10)
    start_cursor: PositiveInt | None = None


@dataclass
class PagedCodesResultDto:
    codes: list[d.Code]
    next_cursor: int


class CodeSearchParam(BaseModel):
    value: str
    type: d.CodeSearchParamType = d.CodeSearchParamType.ILIKE

    def __bool__(self):
        return bool(self.value)


class QueryData(BaseModel):
    code: Optional[CodeSearchParam] = None
    description: Optional[str] = None

    @model_validator(mode="after")  # type: ignore
    def has_data(cls, m: "QueryData") -> "QueryData":
        if not bool(m.code) and not bool(m.description):
            raise ValueError("At least one of 'code' and 'description' must be given")
        return m


class UsersRequestDto(BaseModel):
    ids: Optional[list[UserID]] = None


class SearchCodesRequestDto(BaseModel):
    ontology_id: str
    query: QueryData


class PropertiesRequestDto(BaseModel):
    clazz: Optional[d.PropertyClass] = None


class CollectionRequestDto(BaseModel):
    id: CollectionID
    item_type: Optional[d.ItemType] = None


class CollectionListParametersDto(BaseModel):
    item_type: Optional[d.ItemType] = None


class SearchEntitiesRequestDto(BaseModel):
    entity_type: Literal[
        "PhenotypeCollection", "CodelistCollection", "Phenotype", "Codelist"
    ]
    query: str  # TODO: add validation
    page_size: int = 100
    start_cursor: Optional[CollectionID | PhenotypeID | CodelistID] = None


class SearchResultsResponseDto(BaseModel):
    items: list[Any]  # list[d.Collection | d.Phenotype | d.Codelist]
    total: int


class PhenotypeRequestDto(BaseModel):
    phenotype_id: PhenotypeID


class PropertyValueResponseDto(BaseModel):
    property_id: Optional[PropertyID] = None
    name: str
    value: str


class PropertyValueInputDto(BaseModel):
    property_id: Optional[PropertyID] = None
    name: Optional[str]
    value: Optional[str]


class PropValidatorMixin:
    @field_validator("properties")
    @classmethod
    def no_duplicate_properties(cls, v: Optional[list[PropertyValueInputDto]]):
        if v is None:
            return v

        names = [p.name for p in v]
        if len(names) != len(set(names)):
            raise ValueError("Same properties must not be given multiple times")

        return v


class CodelistRequestDto(BaseModel):
    codelist_id: CodelistID


class UpdateMeRequestDto(BaseModel):
    tutorial_state: str


class CreateCollectionRequestDto(BaseModel, PropValidatorMixin):
    name: str
    item_type: d.ItemType
    description: Optional[str] = None
    properties: list[PropertyValueInputDto] = Field(default_factory=list)
    reference_id: Optional[CollectionID] = None


class DeleteCollectionRequestDto(BaseModel):
    collection_id: CollectionID


class UpdateCollectionRequestDto(BaseModel, PropValidatorMixin):
    collection_id: CollectionID
    name: Optional[str] = None
    description: Optional[str] = None
    properties: Optional[list[PropertyValueInputDto]] = None
    reference_id: Optional[CollectionID] = None
    owner_id: Optional[UserID] = None
    locked: Optional[bool] = None


class MoveCollectionRequestDto(BaseModel):
    collection_id: CollectionID
    ref_collection_id: Optional[CollectionID] = None


class SetCollectionPermissionsRequestDto(BaseModel):
    collection_id: CollectionID
    reader_ids: list[UserID]


class CreatePhenotypeRequestDto(BaseModel, PropValidatorMixin):
    name: str
    position: ReferencePosition
    medical_description: Optional[str] = None
    operational_description: Optional[str] = None
    properties: list[PropertyValueInputDto] = Field(default_factory=list)
    reference_id: Optional[PhenotypeID] = None


class DeletePhenotypeRequestDto(BaseModel):
    phenotype_id: PhenotypeID


class UpdatePhenotypeRequestDto(BaseModel, PropValidatorMixin):
    phenotype_id: PhenotypeID
    position: Optional[ReferencePosition] = None
    name: Optional[str] = None
    medical_description: Optional[str] = None
    operational_description: Optional[str] = None
    properties: Optional[list[PropertyValueInputDto]] = None
    reference_id: Optional[PhenotypeID] = None


class ClonePhenotypeRequestDto(BaseModel):
    phenotype_id: PhenotypeID
    position: Optional[ReferencePosition] = None


class CreateCodelistRequestDto(BaseModel):
    position: ReferencePosition
    name: str
    description: Optional[str] = None
    reference_id: Optional[CodelistID] = None


class DeleteCodelistRequestDto(BaseModel):
    codelist_id: CodelistID


class CloneCodelistRequestDto(BaseModel):
    codelist_id: CodelistID
    position: Optional[ReferencePosition] = None


class UpdateCodelistRequestDto(BaseModel):
    codelist_id: CodelistID
    name: Optional[str] = None
    description: Optional[str] = None
    reference_id: Optional[CodelistID] = None


class MoveCodelistRequestDto(BaseModel):
    codelist_id: CodelistID
    position: ReferencePosition


class ChangesetInput(BaseModel):
    ontology_id: str
    added: list[int] = Field(default_factory=list)
    removed: list[int] = Field(default_factory=list)

    @model_validator(mode="after")  # type: ignore
    def has_data(cls, m: "ChangesetInput") -> "ChangesetInput":
        if not bool(m.added) and not bool(m.removed):
            raise ValueError("At least one of 'added' and 'removed' must have values")
        return m


class CommitInput(BaseModel):
    message: str
    changes: list[ChangesetInput]


class CommitChangesDto(BaseModel):
    codelist_id: CodelistID
    commit: CommitInput


class StoreTransientChangesRequestDto(BaseModel):
    codelist_id: CodelistID
    changes: list[ChangesetInput]


class DiscardTransientChangesRequestDto(BaseModel):
    codelist_id: CodelistID


class CodesetInput(BaseModel):
    ontology_id: str
    codes: list[str] = Field(..., min_length=1)


class CodelistInput(BaseModel):
    name: str = Field(..., min_length=1)
    codesets: list[CodesetInput] = Field(..., min_length=1)


class ImportCodelistsRequestDto(BaseModel):
    container_id: CollectionID | PhenotypeID
    codelists: list[CodelistInput]
    filename: str


@dataclass
class ImportStats:
    fully: int = 0
    partially: int = 0
    skipped: int = 0


@dataclass
class ImportReport:
    codelist_name: str
    codelist_id: CodelistID | None = None
    skipped: bool = True
    partial: bool | None = None
    report: str | None = None


@dataclass
class ImportCodelistsResponseDto:
    stats: ImportStats
    reports: list[ImportReport]
