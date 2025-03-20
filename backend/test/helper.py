import enum
from typing import TYPE_CHECKING
from uuid import UUID

from medconb import domain as d

if TYPE_CHECKING:
    from medconb.domain import (
        CodelistID,
        CollectionID,
        PhenotypeID,
        UserID,
        WorkspaceID,
    )


class IDType(enum.IntEnum):
    User = 0x1000000000000
    Collection = 0x2000000000000
    Workspace = 0x3000000000000
    Codelist = 0x4000000000000
    Phenotype = 0x5000000000000


def _id(id_: int, type_: IDType) -> UUID:
    full_id = type_.value + id_
    match type_:
        case IDType.User:
            return d.UserID(int=full_id)
        case IDType.Workspace:
            return d.WorkspaceID(int=full_id)
        case IDType.Collection:
            return d.CollectionID(int=full_id)
        case IDType.Codelist:
            return d.CodelistID(int=full_id)
        case IDType.Phenotype:
            return d.PhenotypeID(int=full_id)
        case _:
            return UUID(int=full_id)


def _u_id(id_: int) -> "UserID":
    return _id(id_, IDType.User)  # type: ignore


def _w_id(id_: int) -> "WorkspaceID":
    return _id(id_, IDType.Workspace)  # type: ignore


def _c_id(id_: int) -> "CollectionID":
    return _id(id_, IDType.Collection)  # type: ignore


def _cl_id(id_: int) -> "CodelistID":
    return _id(id_, IDType.Codelist)  # type: ignore


def _p_id(id_: int) -> "PhenotypeID":
    return _id(id_, IDType.Phenotype)  # type: ignore


def _cl_ids(ids_: list[int]) -> list["CodelistID"]:
    return [_cl_id(id_) for id_ in ids_]


def _p_ids(ids_: list[int]) -> list["PhenotypeID"]:
    return [_p_id(id_) for id_ in ids_]
