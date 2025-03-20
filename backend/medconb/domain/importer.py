from dataclasses import dataclass
from datetime import datetime
from typing import Callable

from . import (
    Changeset,
    Codelist,
    CodelistID,
    Codeset,
    Commit,
    ContainerSpec,
    SetOfCodeIds,
    UserID,
)


@dataclass
class ValidatedCodeset(Codeset):
    num_invalid_codes: int
    num_total_codes: int
    invalid_codes: list[str]


@dataclass
class ImportReport:
    partial_import: bool = False
    report: str = ""


def import_codelist(
    name: str,
    filename: str,
    codesets: dict[str, ValidatedCodeset],
    skipped_ontologies: list[str],
    new_codelist_id: Callable[[], CodelistID],
    author_id: UserID,
    container_spec: ContainerSpec,
) -> tuple[Codelist, ImportReport] | None:
    """
    Imports a Codelist, given its name and Codeset-like
    data (Codesets with validation info).
    """
    if len(codesets) == 0:
        return None

    changesets: list["Changeset"] = []
    import_report = ImportReport(partial_import=bool(skipped_ontologies))

    for ontology_id, codeset in codesets.items():
        if not codeset.code_ids:
            continue

        if codeset.num_invalid_codes > 0:
            import_report.partial_import = True

        changesets.append(
            Changeset(
                ontology_id=ontology_id,
                code_ids_added=SetOfCodeIds(codeset.code_ids),
            )
        )

    if not changesets:
        return None

    commit_message, description = _create_import_messages(
        codesets, skipped_ontologies, name, filename
    )
    import_report.report = description

    commit = Commit(
        changesets=changesets,
        author_id=author_id,
        created_at=datetime.now(),
        message=commit_message,
    )

    codelist = Codelist(
        id=new_codelist_id(),
        name=name,
        description=description,
        commits=[commit],
        transient_commit=None,
        container=container_spec,
    )

    return codelist, import_report


def _create_import_messages(
    codesets: dict[str, ValidatedCodeset],
    skipped_ontologies: list[str],
    codelist_name: str,
    filename: str,
) -> tuple[str, str]:
    code_count_summary = ", ".join(
        [
            f"{oid}: {cs.number_of_codes}/{cs.num_total_codes}"
            for oid, cs in codesets.items()
            if cs.number_of_codes
        ]
    )
    sum_imported = sum([info.number_of_codes for info in codesets.values()])

    commit_message = (
        f"Imported '{codelist_name}' from file '{filename}' with {sum_imported} codes "
        f"from {len(codesets)} ontologies ({code_count_summary})."
    )

    if skipped_ontologies:
        commit_message += (
            " The following ontologies were skipped because"
            " they didn't have any valid codes: "
        ) + ", ".join(skipped_ontologies)

    codelist_description = commit_message
    if sum([len(info.invalid_codes) for info in codesets.values()]):
        codelist_description += (
            "\n\n"
            + "The following codes were not imported:\n"
            + "\n".join(
                [
                    f"{oid}: " + ",".join(map(str, info.invalid_codes))
                    for oid, info in codesets.items()
                    if info.invalid_codes
                ]
            )
        )

    return commit_message, codelist_description
