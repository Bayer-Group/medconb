import medconb.domain as d
import medconb.graphql.types as gql

from .base import BaseInteractor


class PropertyOptions(BaseInteractor):
    def set_parent(self, obj: d.Property) -> None:
        self.property = obj

    def __call__(self) -> list[str] | None:
        if self.property.dtype == d.PropertyDtype.Enum:
            return list(self.property.dtype_meta.values())

        return None


class ResolveProperties(BaseInteractor):
    def set_parent(self, obj: d.PropertyBag) -> None:
        self.property_bag = obj

    def __call__(self) -> list[gql.PropertyValueResponseDto]:
        return [
            gql.PropertyValueResponseDto(property_id=id_, name=name, value=value)
            for name, (id_, value) in self.property_bag.properties.items()
        ]
