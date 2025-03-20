import json
from dataclasses import asdict, dataclass
from enum import IntEnum, auto
from typing import Optional, Protocol, runtime_checkable


@dataclass
class Ontology:
    id: str
    root_code_ids: list[int]

    @property
    def name(self) -> str:
        return self.id


@dataclass
class Code:
    id: int
    code: str
    ontology_id: str
    description: str
    path: list[int]
    children_ids: list[int]
    last_descendant_id: int

    @property
    def parent_id(self) -> Optional[int]:
        if len(self.path) <= 1:
            return None
        return self.path[-2]

    def serialize(self):
        return json.dumps(asdict(self), separators=(",", ":"))

    @staticmethod
    def deserialize(data: str) -> "Code":
        return Code(**json.loads(data))


class CodeSearchParamType(IntEnum):
    ILIKE = auto()
    POSIX = auto()


@runtime_checkable
class CodeSearchParam(Protocol):  # pragma: no cover
    @property
    def value(self) -> str: ...

    @property
    def type(self) -> CodeSearchParamType: ...


class QueryData(Protocol):  # pragma: no cover
    @property
    def code(self) -> Optional[CodeSearchParam]: ...

    @property
    def description(self) -> Optional[str]: ...
