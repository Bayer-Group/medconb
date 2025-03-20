import enum
from dataclasses import KW_ONLY, dataclass, field
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional, Protocol, Sequence, cast
from uuid import UUID

if TYPE_CHECKING:
    import medconb.domain as d


class UserID(UUID): ...


class WorkspaceID(UUID): ...


# If a collection is shared with the public, this is the user ID of the public user.
PUBLIC_USER_ID = UserID("00ACCE55-0400-A110-1337-000000000000")


class PropertyID(int): ...


class PropertyClass(enum.Enum):  # TODO: make StrEnum in python 3.11
    Phenotype = "Phenotype"
    Collection = "Collection"


class PropertyDtype(enum.Enum):  # TODO: make StrEnum in python 3.11
    Text = "Text"
    Number = "Number"
    Enum = "Enum"
    Time = "Time"
    User = "User"


@dataclass
class Property:
    _: KW_ONLY
    id: PropertyID
    name: str
    class_name: PropertyClass
    dtype: PropertyDtype
    dtype_meta: dict
    required: bool
    read_only: bool


@dataclass
class PropertyBag:
    _: KW_ONLY

    """key = property name, value = (Property ID, value)"""
    properties: dict[str, tuple[Optional[PropertyID], str]] = field(
        default_factory=dict
    )


class CollectionType(enum.Enum):
    Phenotype = "Phenotype"
    Codelist = "Codelist"


class PropertyBagItemInput(Protocol):
    property_id: Optional[PropertyID]
    name: Optional[str]
    value: Optional[str]


def init_property_bag(
    all_props: "list[d.Property]",
    current_user_id: UserID,
) -> dict[str, tuple[Optional[PropertyID], str]]:
    """
    init_property_bag initializes a property bag with the default
    read_only properties.
    """
    all_props_by_name = {p.name: p for p in all_props}

    property_bag: dict[str, tuple[Optional[PropertyID], str]] = {}

    prop = all_props_by_name["Created"]
    property_bag["Created"] = (prop.id, str(datetime.now(tz=timezone.utc).timestamp()))

    prop = all_props_by_name["Created By"]
    property_bag["Created By"] = (prop.id, str(current_user_id))

    return property_bag


def update_property_bag(  # noqa R901 - too complex
    property_bag: dict[str, tuple[Optional[PropertyID], str]],
    input_: "Sequence[PropertyBagItemInput]",
    all_props: "list[d.Property]",
    current_user_id: UserID,
) -> None:
    """
    update_property_bag updates `property_bag` with the data from
    `input`.

    A value of None deletes the property.

    It validates the input and final property bag such that:
     * the input name and ID are consistent,
     * the property bag contains all required properties,
     * the property values are valid for the given property type.
     * automatically generated fields are updated.
    """
    all_props_by_name = {p.name: p for p in all_props}
    all_props_by_id = {p.id: p for p in all_props}

    for p_in in input_:
        _sanitize_property_input(
            prop_in=p_in,
            all_props_by_name=all_props_by_name,
            all_props_by_id=all_props_by_id,
        )
        p_in.name = cast(str, p_in.name)

        if p_in.property_id is None:  # custom property
            if p_in.value is None:
                del property_bag[p_in.name]
            else:
                property_bag[p_in.name] = (None, p_in.value)

            continue

        prop = all_props_by_id[p_in.property_id]
        _assert_property_is_editable(prop)

        if p_in.value is None:
            del property_bag[p_in.name]
            continue

        if prop.dtype == PropertyDtype.Enum:
            if p_in.value not in prop.dtype_meta.values():
                raise ValueError(
                    f"Value '{p_in.value}' is not a valid value for property"
                    f" '{prop.name}'"
                )

        property_bag[p_in.name] = (prop.id, p_in.value)

    set_auto_generated_props(
        property_bag=property_bag,
        user_id=current_user_id,
        all_props_by_name=all_props_by_name,
    )

    # make sure all required properties are set

    bags_prop_ids = [x[0] for x in property_bag.values() if x[0] is not None]

    for prop in filter(lambda p: p.required, all_props):
        if prop.id in bags_prop_ids:
            continue

        property_bag[prop.name] = (prop.id, "")


def _sanitize_property_input(
    prop_in: PropertyBagItemInput,
    all_props_by_name: dict[str, Property],
    all_props_by_id: dict[PropertyID, Property],
) -> None:
    """
    _sanitize_property_input checks the given property id and name
    for consistency and existence.

    The following is true for the resulting `prop_in`:
    It will have either a property ID or a name.
    If the property ID is None, it is a custom property and the name
    does not collide with any existing property.
    If the property ID is given,
     * that property exists and
     * the name is consistent with that property.
    """
    if prop_in.property_id is None:
        if prop_in.name is None:
            raise ValueError("Property ID and name are both None")
        if prop_in.name in all_props_by_name:
            raise ValueError(
                f"Name of custom property '{prop_in.name}' is already given"
            )
        return

    if prop_in.property_id not in all_props_by_id:
        raise ValueError(f"Property ID '{prop_in.property_id}' does not exist")

    prop = all_props_by_id[prop_in.property_id]

    if prop_in.name is None:  # lazy setter
        prop_in.name = prop.name

    if prop_in.name != prop.name:
        raise ValueError(
            f"Given PropertyID '{prop.id}' has the name '{prop.name}' which"
            f" is inconsistent with the given name '{prop_in.name}'"
        )


def _assert_property_is_editable(prop: Property) -> None:
    if prop.read_only:
        raise ValueError(f"Property '{prop.name}' is read-only")

    if prop.dtype not in (PropertyDtype.Text, PropertyDtype.Enum):
        raise ValueError("Only properties of type Text or Enum can be edited")


def set_auto_generated_props(
    property_bag: dict[str, tuple[Optional[PropertyID], str]],
    user_id: UserID,
    all_props_by_name: dict[str, Property],
) -> None:
    prop = all_props_by_name["Last Edited"]
    property_bag["Last Edited"] = (
        prop.id,
        str(datetime.now(tz=timezone.utc).timestamp()),
    )

    prop = all_props_by_name["Last Edited By"]
    property_bag["Last Edited By"] = (prop.id, str(user_id))
