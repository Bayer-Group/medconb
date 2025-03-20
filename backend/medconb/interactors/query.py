from typing import Optional, Sequence, cast

from plyse import GrammarFactory, QueryParser

import medconb.domain as d
import medconb.graphql.types as gql

from .base import BaseInteractor, CollectionNotExistsException
from .codelist import CodelistNotExistsException
from .phenotype import PhenotypeNotExistsException


class Ontologies(BaseInteractor):
    def __call__(self) -> list[d.Ontology]:
        return self.ontology_repository.get_all()


class Ontology(BaseInteractor):
    def __call__(self, dto: gql.OntologyRequestDto) -> Optional[d.Ontology]:
        return self.ontology_repository.get(dto.name)


class Code(BaseInteractor):
    def __call__(self, dto: gql.CodeRequestDto) -> Optional[d.Code]:
        return self.code_repository.get(dto.id)


class Codes(BaseInteractor):
    def __call__(self, dto: gql.CodesRequestDto) -> list[d.Code]:
        return self.code_repository.get_all(dto.ids)


class SearchCodes(BaseInteractor):
    def __call__(self, dto: gql.SearchCodesRequestDto) -> list[d.Code]:
        return self.code_repository.search_codes(dto.query, dto.ontology_id)


class SearchEntities(BaseInteractor):
    parser = QueryParser(GrammarFactory.build_default())

    def __call__(
        self, dto: gql.SearchEntitiesRequestDto
    ) -> gql.SearchResultsResponseDto:
        query = self.parser.parse(dto.query)
        items: Sequence[d.Collection | d.Phenotype | d.Codelist] = []

        match dto.entity_type:
            case "PhenotypeCollection":
                dto.start_cursor = cast(d.CollectionID | None, dto.start_cursor)
                items, num_total = self.collection_repository.search(
                    query,
                    d.ItemType.Phenotype,
                    self.user.id,
                    dto.page_size,
                    dto.start_cursor,
                )
                return gql.SearchResultsResponseDto(items=items, total=num_total)
            case "CodelistCollection":
                dto.start_cursor = cast(d.CollectionID | None, dto.start_cursor)
                items, num_total = self.collection_repository.search(
                    query,
                    d.ItemType.Codelist,
                    self.user.id,
                    dto.page_size,
                    dto.start_cursor,
                )
                return gql.SearchResultsResponseDto(items=items, total=num_total)
            case "Phenotype":
                dto.start_cursor = cast(d.PhenotypeID | None, dto.start_cursor)
                items, num_total = self.phenotype_repository.search(
                    query, self.user.id, dto.page_size, dto.start_cursor
                )
                return gql.SearchResultsResponseDto(items=items, total=num_total)
            case "Codelist":
                dto.start_cursor = cast(d.CodelistID | None, dto.start_cursor)
                items, num_total = self.codelist_repository.search(
                    query, self.user.id, dto.page_size, dto.start_cursor
                )
                return gql.SearchResultsResponseDto(items=items, total=num_total)


class Properties(BaseInteractor):
    def __call__(self, dto: gql.PropertiesRequestDto) -> list[d.Property]:
        return self.property_repository.get_all(dto.clazz)


class Collection(BaseInteractor):
    def __call__(self, dto: gql.CollectionRequestDto) -> d.Collection:
        collection = self.collection_repository.get(dto.id)

        if not collection or not d.collection_readable_by_user(collection, self.user):
            raise CollectionNotExistsException(dto.id)

        return collection


class Phenotype(BaseInteractor):
    def __call__(self, dto: gql.PhenotypeRequestDto) -> d.Phenotype:
        phenotype = self.phenotype_repository.get(dto.phenotype_id)

        if phenotype and self.is_readable_by_current_user(phenotype):
            return phenotype

        raise PhenotypeNotExistsException(dto.phenotype_id)


class Codelist(BaseInteractor):
    def __call__(self, dto: gql.CodelistRequestDto) -> d.Codelist:
        codelist = self.codelist_repository.get(dto.codelist_id)

        if codelist and self.is_readable_by_current_user(codelist):
            return codelist

        raise CodelistNotExistsException(dto.codelist_id)


class Users(BaseInteractor):
    def __call__(self, dto: gql.UsersRequestDto) -> list[d.User]:
        return [
            d.User(
                id=u.id,
                external_id=u.external_id,
                name=u.name,
                workspace=d.Workspace(d.WorkspaceID(int=0)),
            )
            for u in self.user_repository.get_all(dto.ids)
        ]
