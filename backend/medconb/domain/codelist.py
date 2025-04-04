from copy import deepcopy
from dataclasses import dataclass, field
from datetime import datetime
from functools import reduce
from operator import add
from typing import TYPE_CHECKING, AbstractSet, Iterable
from uuid import UUID

from .base import WorkspaceID
from .container import ContainerSpec, ItemType
from .user import User, Workspace

if TYPE_CHECKING:
    from .base import UserID
    from .collection import Collection
    from .phenotype import Phenotype


class CodelistID(UUID): ...


class SetOfCodeIds(set[int]):
    """
    A set of code ids that makes sure that
      * the ids to add are not already in the set,
      * the ids to remove are in the set and
      * all ids are unique.
    """

    def add(self, code_id: int):
        if code_id in self:
            raise ValueError("Code already exists")
        super().add(code_id)

    def __or__(self, code_ids: AbstractSet):
        if not super().isdisjoint(code_ids):  # self.isdisjoint(code_ids)
            raise ValueError("Code already exists")
        return SetOfCodeIds(super().__or__(code_ids))

    def __ior__(self, code_ids: AbstractSet):  # type: ignore
        if not super().isdisjoint(  # type: ignore
            code_ids
        ):  # self.isdisjoint(code_ids)
            raise ValueError("Code already exists")
        super().__ior__(code_ids)  # type: ignore
        return self

    def __sub__(self, code_ids: AbstractSet):
        if not super().issuperset(code_ids):  # self.issuperset(code_ids)
            raise ValueError("Code does not exist")
        return SetOfCodeIds(super().__sub__(code_ids))

    def __isub__(self, code_ids: AbstractSet):
        if not super().issuperset(  # type: ignore
            code_ids
        ):  # self.issuperset(code_ids)
            raise ValueError("Code does not exist")
        super().__isub__(code_ids)  # type: ignore
        return self

    # fmt: off
    def copy(self): raise NotImplementedError()  # noqa E704
    def difference(self, *s): raise NotImplementedError()  # noqa E704
    def difference_update(self, *s): raise NotImplementedError()  # noqa E704
    def discard(self, __element): raise NotImplementedError()  # noqa E704
    def intersection(self, *s): raise NotImplementedError()  # noqa E704
    def intersection_update(self, *s): raise NotImplementedError()  # noqa E704
    def isdisjoint(self, __s): raise NotImplementedError()  # noqa E704
    def issubset(self, __s): raise NotImplementedError()  # noqa E704
    def issuperset(self, __s): raise NotImplementedError()  # noqa E704
    def remove(self, __element): raise NotImplementedError()  # noqa E704
    def symmetric_difference(self, __s): raise NotImplementedError()  # noqa E704,E501
    def symmetric_difference_update(self, __s): raise NotImplementedError()  # noqa E704,E501
    def union(self, *s): raise NotImplementedError()  # noqa E704
    def update(self, *s): raise NotImplementedError()  # noqa E704
    def __and__(self, __s): raise NotImplementedError()  # noqa E704
    def __iand__(self, __s): raise NotImplementedError()  # noqa E704,E501
    def __xor__(self, __s): raise NotImplementedError()  # noqa E704
    def __ixor__(self, __s): raise NotImplementedError()  # type: ignore[override,misc]  # noqa E704
    def __le__(self, __s): raise NotImplementedError()  # noqa E704
    def __lt__(self, __s): raise NotImplementedError()  # noqa E704
    def __ge__(self, __s): raise NotImplementedError()  # noqa E704
    def __gt__(self, __s): raise NotImplementedError()  # noqa E704
    # fmt: on


@dataclass
class Changeset:
    """
    A Changeset is an aggregate of all codes that were added and removed
    from an ontology.
    """

    ontology_id: str
    code_ids_added: SetOfCodeIds
    code_ids_removed: SetOfCodeIds

    def __init__(
        self,
        ontology_id: str,
        code_ids_added: Iterable[int] = SetOfCodeIds(),
        code_ids_removed: Iterable[int] = SetOfCodeIds(),
    ):
        self.ontology_id = ontology_id
        self.code_ids_added = SetOfCodeIds(code_ids_added)
        self.code_ids_removed = SetOfCodeIds(code_ids_removed)

    def __deepcopy__(self, memo):
        return Changeset(
            ontology_id=self.ontology_id,
            code_ids_added=SetOfCodeIds(self.code_ids_added),
            code_ids_removed=SetOfCodeIds(self.code_ids_removed),
        )


@dataclass
class Author(User):
    @staticmethod
    def from_user(user: "User"):
        return Author(
            id=user.id,
            external_id=user.external_id,
            name=user.name,
            workspace=Workspace(WorkspaceID(int=0)),
        )


@dataclass
class Commit:
    """
    A Commit of a codelist is a differential data structure that
    stores changes to a codelist.
    It contains all changesets of all changed ontologies and meta
    information like the author, when it was created and a change
    message.
    """

    changesets: list[Changeset]
    author_id: "UserID"
    created_at: datetime
    message: str

    def __deepcopy__(self, memo):
        return Commit(
            changesets=[deepcopy(cs) for cs in self.changesets],
            author_id=self.author_id,
            created_at=self.created_at,
            message=self.message,
        )


@dataclass
class Codeset:
    """
    A Codeset represents a set of codes from one medical coding system
    (ontology) that are part of a specific codelist version.
    Each codelist can contain multiple codesets, one for each ontology
    it references.
    """

    ontology_id: str
    code_ids: SetOfCodeIds

    @property
    def number_of_codes(self):
        return len(self.code_ids)

    def to_changeset(self):
        return Changeset(
            ontology_id=self.ontology_id,
            code_ids_added=self.code_ids,
            code_ids_removed=SetOfCodeIds(),
        )


class Codesets(list[Codeset]):
    """
    Codesets of a codelist is the aggregate of all codesets (one
    per ontology) that are part of this codelist.
    """

    def __init__(
        self, __iterable: Iterable[Codeset] | None = None, *, version: int = 1
    ):
        self._version = version
        super().__init__(__iterable) if __iterable is not None else super().__init__()

    def __add__(self, commit: Commit):  # type: ignore
        """
        Adds a commit to this version: adds and removes the
        respective codes to/from the version, while incrementing the
        version number.

        Returns a new object.

        TODO: is not a derived class, but a enclosing. refactor!
        """
        codesets = deepcopy(self)

        ontology_map: dict[str, int] = {
            cs.ontology_id: idx for idx, cs in enumerate(codesets)
        }

        for changeset in commit.changesets:
            if changeset.ontology_id not in ontology_map:
                codesets.append(Codeset(changeset.ontology_id, SetOfCodeIds()))
                ontology_map[changeset.ontology_id] = len(codesets) - 1

            cs = codesets[ontology_map[changeset.ontology_id]]
            cs.code_ids |= changeset.code_ids_added
            cs.code_ids -= changeset.code_ids_removed

        codesets = Codesets(filter(lambda cs: cs.number_of_codes > 0, codesets))
        codesets._version += 1
        return codesets

    @property
    def version(self):
        return self._version


@dataclass
class Codelist:
    id: CodelistID
    name: str
    description: str
    commits: list[Commit]
    transient_commit: Commit | None
    container: ContainerSpec
    # transient_commit_count: int
    reference_id: CodelistID | None = None

    _codesets: Codesets | None = field(init=False, repr=False, default=None)

    @property
    def type_(self) -> ItemType:
        return ItemType.Codelist

    @property
    def codesets(self) -> Codesets:
        if self._codesets is None:
            self._codesets = reduce(add, self.commits, Codesets())
        return self._codesets

    @property
    def version(self) -> int:
        return self.codesets.version

    @property
    def transient_codesets(self) -> Codesets | None:
        if self.transient_commit:
            return self.codesets + self.transient_commit
        return None

    def add_commit(self, commit: Commit):
        self.codesets + commit  # check that the commit is valid to apply
        self.commits.append(commit)
        self.transient_commit = None
        self._codesets = None

    def __eq__(self, other: object):  # noqa: radon complexity
        if not isinstance(other, Codelist):
            return NotImplemented

        return self.id == other.id


def create_cloned_codelist_name(codelist_name: str, illegal_names: list[str]) -> str:
    if codelist_name not in illegal_names:
        return codelist_name

    new_codelist_name = f"{codelist_name} (copy)"
    i = 2
    while new_codelist_name in illegal_names:
        new_codelist_name = f"{codelist_name} (copy {i})"
        i += 1
    return new_codelist_name


def squash_codelist(
    codelist: Codelist, new_id: CodelistID, author_id: "UserID"
) -> Codelist:
    """
    Creates a new codelist that has all commits of the original codelist
    squashed into one. If there are changes in the transient commit,
    they will be added as an transient commit as well.
    """

    squashed_commit = Commit(
        changesets=[codeset.to_changeset() for codeset in codelist.codesets],
        author_id=author_id,
        created_at=datetime.now(),
        message=f"Squashed from codelist {codelist.name} ({codelist.id})",
    )

    transient_commit = None
    if codelist.transient_commit:
        transient_commit = Commit(
            changesets=deepcopy(codelist.transient_commit.changesets),
            author_id=author_id,
            created_at=datetime.now(),
            message="transient",
        )

    new_description = (
        "Squashed from codelist {codelist.name} ({codelist.id})\n\n"
        + codelist.description
    )

    return Codelist(
        id=new_id,
        name=codelist.name,
        description=new_description,
        commits=[squashed_commit],
        transient_commit=transient_commit,
        container=codelist.container,
        reference_id=codelist.id,
    )


def delete_codelist(
    container: "Collection | Phenotype",
    codelist: Codelist,
    referencing_codelists: list[Codelist],
):
    """
    Delete the codelist `codelist` which is part of the container
    `container`.

    Also remove the reference to the codelist from all codelists in
    `referencing_codelists`.
    """
    container.remove_item(codelist.id)

    for cl in referencing_codelists:
        cl.reference_id = None
