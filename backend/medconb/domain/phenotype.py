from dataclasses import KW_ONLY, dataclass, field
from uuid import UUID

from .base import PropertyBag
from .codelist import Codelist
from .container import ContainerSpec, ContainerType, ItemType, OrderedContainer


class PhenotypeID(UUID): ...


@dataclass
class Phenotype(OrderedContainer, PropertyBag):
    _: KW_ONLY
    id: PhenotypeID
    name: str
    medical_description: str
    operational_description: str
    container_type: ContainerType = field(init=False, default=ContainerType.Phenotype)
    item_type: ItemType = field(init=False, default=ItemType.Codelist)
    container: ContainerSpec
    reference_id: PhenotypeID | None = None

    @property
    def type_(self) -> ItemType:
        return ItemType.Phenotype

    @property
    def codelists(self) -> list[Codelist]:
        return self.item_ids

    @codelists.setter
    def codelists(self, codelists: list[Codelist]) -> None:
        self.item_ids = codelists
