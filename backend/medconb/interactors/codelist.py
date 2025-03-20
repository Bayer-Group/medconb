from abc import ABC
from collections import Counter
from copy import deepcopy
from datetime import datetime
from typing import cast

import medconb.domain as d
import medconb.domain.importer as importer
import medconb.graphql.types as gql

from .base import (
    BaseInteractor,
    CodelistNotExistsException,
    ContainerNotExistsException,
)


class BaseCodelistInteractor(BaseInteractor, ABC):
    def _load_codelist(
        self, codelist_id: d.CodelistID, writeable: bool = True
    ) -> d.Codelist:
        codelist = self.codelist_repository.get(codelist_id)

        if codelist is None:
            raise CodelistNotExistsException(codelist_id)

        if (
            writeable
            and self.is_writable_by_current_user(codelist)
            or not writeable
            and self.is_readable_by_current_user(codelist)
        ):
            return codelist

        raise CodelistNotExistsException(codelist_id)


class CreateCodelist(BaseCodelistInteractor):
    """
    Creates a new codelist and positions it at the specified position.
    """

    def __call__(self, dto: gql.CreateCodelistRequestDto) -> d.Codelist:
        (ref_ctr, ref_cl) = self._identify_ref(
            dto.position, item_type=d.ItemType.Codelist
        )
        ref_cl = cast(d.Codelist, ref_cl)
        ref_ctr = cast(d.Collection | d.Phenotype, ref_ctr)

        if not self.is_writable_by_current_user(ref_ctr):
            raise ContainerNotExistsException(ref_ctr.id, ref_ctr.container_type)

        codelist = d.Codelist(
            id=self.codelist_repository.new_id(),
            name=dto.name,
            description=dto.description or "Empty Description of Codelist",
            commits=[],
            transient_commit=None,
            container=ref_ctr.to_spec(),
            reference_id=dto.reference_id,
        )

        d.add_or_move_item(
            container=None,
            item=codelist,
            ref_container=ref_ctr,
            ref_item=ref_cl,
        )

        self.session.add(codelist)

        return codelist


class UpdateCodelist(BaseCodelistInteractor):
    """
    Updates the name and/or description of a codelist.
    """

    def __call__(self, dto: gql.UpdateCodelistRequestDto) -> d.Codelist:
        codelist = self._load_codelist(dto.codelist_id)

        root_collection = self._must_load_root_collection_of(codelist)
        if root_collection.locked:
            raise ValueError(
                f"Collection {root_collection.id} of Codelist {codelist.id} is locked"
                " and cannot be updated"
            )

        if dto.name is not None:
            codelist.name = dto.name

        if dto.description is not None:
            codelist.description = dto.description

        if dto.reference_id is not None:
            codelist.reference_id = dto.reference_id

        return codelist


class DeleteCodelist(BaseCodelistInteractor):
    def __call__(self, dto: gql.DeleteCodelistRequestDto) -> bool:
        codelist = self._load_codelist(dto.codelist_id)
        container = self._must_load_container(codelist.container)
        assert isinstance(container, (d.Collection, d.Phenotype))
        assert codelist in container

        root_collection = self._must_load_root_collection_of(codelist)
        if root_collection.locked:
            raise ValueError(
                f"Collection {root_collection.id} of codelist {codelist.id} is locked "
                "and cannot be deleted"
            )

        d.delete_codelist(
            container=container,
            codelist=codelist,
            referencing_codelists=self.codelist_repository.get_by(
                "reference_id", codelist.id
            ),
        )

        self.codelist_repository.delete(codelist.id)

        return True


class CloneCodelist(BaseCodelistInteractor):
    def __call__(
        self,
        dto: gql.CloneCodelistRequestDto,
    ) -> d.Codelist:
        codelist = self._load_codelist(dto.codelist_id)
        container = self._must_load_container(codelist.container)
        assert isinstance(container, (d.Collection, d.Phenotype))
        assert codelist in container

        ref_container: d.Collection | d.Phenotype = container
        ref_item: d.Codelist = codelist

        if dto.position:
            ref_container, ref_item = cast(
                tuple[d.Collection | d.Phenotype, d.Codelist],
                self._identify_ref(
                    dto.position,
                    default_container=container,
                    item_type=d.ItemType.Codelist,
                ),
            )

        siblings = self.codelist_repository.get_all(ref_container.item_ids)
        illegal_names = [x.name for x in siblings]

        new_commits = deepcopy(codelist.commits)
        new_transient_commit = deepcopy(codelist.transient_commit)

        new_codelist = d.Codelist(
            id=self.codelist_repository.new_id(),
            name=d.create_cloned_codelist_name(codelist.name, illegal_names),
            description=codelist.description,
            commits=new_commits,
            transient_commit=new_transient_commit,
            container=ref_container.to_spec(),
            reference_id=codelist.id,
        )

        d.add_or_move_item(
            container=None,
            item=new_codelist,
            ref_container=ref_container,
            ref_item=ref_item,
        )

        self.session.add(new_codelist)

        return new_codelist


class MoveCodelist(BaseCodelistInteractor):
    def __call__(self, dto: gql.MoveCodelistRequestDto) -> bool:
        """
        Moves a Codelist. The destination may be a different container.

        The destination is identified by the position. Position is a
        tuple of (container_id, item_id). If the container_id is None,
        the item stays in the same container. If the item_id is None,
        the item is moved to the first position in the container.
        """
        codelist = self._load_codelist(dto.codelist_id)
        container = self._must_load_container(codelist.container)
        (ref_ctr, ref_cl) = self._identify_ref(
            dto.position, default_container=container, item_type=d.ItemType.Codelist
        )

        assert isinstance(ref_ctr, (d.Collection, d.Phenotype))
        assert ref_cl is None or isinstance(ref_cl, (d.Codelist))
        assert isinstance(container, (d.Collection, d.Phenotype))
        assert codelist in container

        if not self.is_writable_by_current_user(ref_ctr):
            raise ContainerNotExistsException(ref_ctr.id, ref_ctr.container_type)

        d.add_or_move_item(
            container=container,
            item=codelist,
            ref_container=ref_ctr,
            ref_item=ref_cl,
        )

        return True


class ImportCodelists(BaseCodelistInteractor):  # noqa R901 - too complex
    def __call__(
        self, dto: gql.ImportCodelistsRequestDto
    ) -> gql.ImportCodelistsResponseDto:
        """
        Imports Codelists from external source.

        It receives a list of codes for the initial commit. These codes
        are validated before the codelist is created. Finally,
        a report is returned.
        """
        container = self._must_load_container(
            dto.container_id, filters={"item_type": d.ItemType.Codelist}
        )

        assert isinstance(container, (d.Collection, d.Phenotype))

        root_collection = self._must_load_root_collection_of(container)

        if not self.is_writable_by_current_user(root_collection):
            raise ContainerNotExistsException(container.id, container.container_type)

        if root_collection.locked:
            raise ValueError(
                f"Collection {root_collection.id} is locked and cannot be updated"
            )

        container_spec = container.to_spec()

        codelist_repo = self.codelist_repository
        top_level_codelists = codelist_repo.get_all(container.item_ids)
        existing_cl_names = [cl.name for cl in top_level_codelists]

        stats = gql.ImportStats()
        reports = []

        for codelist_data in dto.codelists[::-1]:
            report = gql.ImportReport(codelist_name=codelist_data.name)
            reports.append(report)

            validated_codesets, skipped_ontologies = self._validate_input(
                codelist_data, existing_cl_names
            )
            if not validated_codesets:
                stats.skipped += 1
                continue

            import_result = importer.import_codelist(
                name=codelist_data.name,
                filename=dto.filename,
                codesets=validated_codesets,
                skipped_ontologies=skipped_ontologies,
                new_codelist_id=self.codelist_repository.new_id,
                author_id=self.user.id,
                container_spec=container_spec,
            )

            if not import_result:
                stats.skipped += 1
                continue

            codelist, import_report = import_result

            d.add_or_move_item(
                container=None,
                item=codelist,
                ref_container=container,
                ref_item=top_level_codelists[-1] if len(top_level_codelists) else None,
            )
            self.session.add(codelist)

            existing_cl_names.append(codelist_data.name)

            report.skipped = False
            report.codelist_id = codelist.id
            report.report = import_report.report
            report.partial = import_report.partial_import

            if import_report.partial_import:
                stats.partially += 1
            else:
                stats.fully += 1

        return gql.ImportCodelistsResponseDto(stats=stats, reports=reports)

    def _validate_input(
        self,
        codelist_data: gql.CodelistInput,
        existing_cl_names: list[str],
    ) -> tuple[dict[str, importer.ValidatedCodeset], list[str]]:
        """
        Validates the input for the import and raises an exception if
        the data is invalid.
        It returns the validated codesets and a list of ontologies that
        did not have any codes after validation.
        """
        if codelist_data.name in existing_cl_names:
            raise ValueError(
                f"Codelist with the name '{codelist_data.name}' already exists."
            )

        ontology_ids = [cs.ontology_id for cs in codelist_data.codesets]
        if Counter(ontology_ids).most_common(1)[0][1] > 1:
            raise ValueError("An ontology must only occur once in a codelists codesets")

        existing_ontologies = self.session.ontology_repository.get_all()
        existing_ontology_ids = [o.id for o in existing_ontologies]
        ontology_difference = set(ontology_ids).difference(existing_ontology_ids)

        if len(ontology_difference) > 0:
            raise ValueError(
                "The following referenced ontologies do not exist: "
                + ", ".join(ontology_difference)
            )

        return self._validate_codesets(codelist_data.codesets)

    def _validate_codesets(  # noqa: complexity
        self, codesets: list[gql.CodesetInput]
    ) -> tuple[dict[str, importer.ValidatedCodeset], list[str]]:
        validated_cs: dict[str, importer.ValidatedCodeset | None] = {}

        for codeset in codesets:
            cleaned_codes = [c.strip() for c in codeset.codes]
            codes = self.session.code_repository.find_codes(
                cleaned_codes, codeset.ontology_id
            )

            valid_codes = [c for c, id_ in codes.items() if id_]
            valid_code_ids = [id_ for id_ in codes.values() if id_]
            invalid_codes = [c for c, id_ in codes.items() if not id_]

            validated_cs[codeset.ontology_id] = None
            if valid_codes:
                validated_cs[codeset.ontology_id] = importer.ValidatedCodeset(
                    ontology_id=codeset.ontology_id,
                    code_ids=d.SetOfCodeIds(valid_code_ids),
                    num_invalid_codes=len(invalid_codes),
                    num_total_codes=len(valid_codes) + len(invalid_codes),
                    invalid_codes=invalid_codes,
                )

        non_empty_codesets = {k: v for k, v in validated_cs.items() if v}
        skipped_ontologies = [k for k, v in validated_cs.items() if not v]

        return non_empty_codesets, skipped_ontologies


class CommitChanges(BaseCodelistInteractor):
    def __call__(self, dto: gql.CommitChangesDto) -> d.Codelist:
        """
        Commits a new version of a codelist. This version
        contains one or more changesets - one for every ontology
        affected.
        """
        codelist = self._load_codelist(dto.codelist_id)

        root_collection = self._must_load_root_collection_of(codelist)
        if root_collection.locked:
            raise ValueError(
                f"Collection {root_collection.id} of codelist {codelist.id} is locked "
                "and cannot be updated"
            )

        commit = dto.commit
        changesets = [
            d.Changeset(
                ontology_id=cs.ontology_id,
                code_ids_added=d.SetOfCodeIds(cs.added or []),
                code_ids_removed=d.SetOfCodeIds(cs.removed or []),
            )
            for cs in commit.changes
        ]

        codelist.add_commit(
            d.Commit(
                author_id=self.user.id,
                created_at=datetime.now(),
                message=commit.message,
                changesets=changesets,
            )
        )

        return codelist


class StoreTransientChanges(BaseCodelistInteractor):
    def __call__(self, dto: gql.StoreTransientChangesRequestDto) -> d.Codelist:
        """
        Stores a transient version of a codelist. That
        transient version stores changes made by the user which have
        not yet been committed as a new version.
        """
        codelist = self._load_codelist(dto.codelist_id)

        root_collection = self._must_load_root_collection_of(codelist)
        if root_collection.locked:
            raise ValueError(
                f"Collection {root_collection.id} of codelist {codelist.id} is locked "
                "and cannot be updated"
            )

        changesets = [
            d.Changeset(
                ontology_id=cs.ontology_id,
                code_ids_added=d.SetOfCodeIds(cs.added or []),
                code_ids_removed=d.SetOfCodeIds(cs.removed or []),
            )
            for cs in dto.changes
        ]

        codelist.transient_commit = d.Commit(
            author_id=self.user.id,
            created_at=datetime.now(),
            message="transient",
            changesets=changesets,
        )

        # verify consistency of transient commit
        codelist.transient_codesets

        return codelist


class DiscardTransientChanges(BaseCodelistInteractor):
    def __call__(self, dto: gql.DiscardTransientChangesRequestDto) -> d.Codelist:
        """
        Discards a transient version of a codelist.
        """
        codelist = self._load_codelist(dto.codelist_id)

        root_collection = self._must_load_root_collection_of(codelist)
        if root_collection.locked:
            raise ValueError(
                f"Collection {root_collection.id} of codelist {codelist.id} is locked "
                "and cannot be updated"
            )

        codelist.transient_commit = None

        return codelist
