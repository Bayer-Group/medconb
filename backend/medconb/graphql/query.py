from typing import Callable, Iterable, Literal, Optional, Sequence, cast

from ariadne import UnionType

import medconb.domain as d
import medconb.interactors as interactors
from medconb.types import Session

from .helper import InteractorResolver, get_sub_fields
from .objects import ObjectType, QueryType
from .types import PagedCodesDto

query = QueryType()
user = ObjectType("User")
workspace = ObjectType("Workspace", d.Workspace)
collection = ObjectType("Collection", d.Collection)
phenotype = ObjectType("Phenotype", d.Phenotype)
codelist = ObjectType("Codelist", d.Codelist)
property = ObjectType("Property", d.Property)
ontology = ObjectType("Ontology")
codeset = ObjectType("Codeset")
commit = ObjectType("Commit")
changeset = ObjectType("Changeset")
code = ObjectType("Code")
container_spec = ObjectType("ContainerSpec", d.ContainerSpec)

container_item = UnionType("ContainerItem")
search_result_item = UnionType("SearchResultItem")


property.set_alias("class", "class_name")
property.set_field("options", InteractorResolver(interactors.PropertyOptions))

collection.set_field("properties", InteractorResolver(interactors.ResolveProperties))
collection.set_field(
    "visibility", InteractorResolver(interactors.ResolveContainerSpecVisibility)
)
phenotype.set_field("properties", InteractorResolver(interactors.ResolveProperties))

phenotype.set_field(
    "containerHierarchy",
    InteractorResolver(interactors.ResolveContainerItemContainerHierarchy),
)
codelist.set_field(
    "containerHierarchy",
    InteractorResolver(interactors.ResolveContainerItemContainerHierarchy),
)

phenotype.set_field(
    "ownerID",
    InteractorResolver(interactors.ResolveContainerItemOwnerID),
)
codelist.set_field(
    "ownerID",
    InteractorResolver(interactors.ResolveContainerItemOwnerID),
)

container_spec.set_alias("type", "type_")
container_spec.set_field(
    "name", InteractorResolver(interactors.ResolveContainerSpecName)
)
container_spec.set_field(
    "locked", InteractorResolver(interactors.ResolveContainerSpecLocked)
)
container_spec.set_field(
    "visibility", InteractorResolver(interactors.ResolveContainerSpecVisibility)
)


@container_item.type_resolver
def resolve_collection_item_type(obj, *_):
    match obj:
        case d.Codelist():
            return "Codelist"
        case d.Phenotype():
            return "Phenotype"
        case _:
            return None


@search_result_item.type_resolver
def resolve_search_result_item_type(obj, *_):
    match obj:
        case d.Collection():
            return "Collection"
        case d.Phenotype():
            return "Phenotype"
        case d.Codelist():
            return "Codelist"
        case _:
            return None


@query.field("self")
def resolve_self(_, info) -> d.User:
    scope = info.context["request"].scope
    user = scope["user"]
    return user


query.set_field("ontologies", InteractorResolver(interactors.Ontologies))
query.set_field("ontology", InteractorResolver(interactors.Ontology))
query.set_field("code", InteractorResolver(interactors.Code))
query.set_field("codes", InteractorResolver(interactors.Codes))
query.set_field("properties", InteractorResolver(interactors.Properties))
query.set_field("collection", InteractorResolver(interactors.Collection))
query.set_field("phenotype", InteractorResolver(interactors.Phenotype))
query.set_field("codelist", InteractorResolver(interactors.Codelist))

query.set_field("searchCodes", InteractorResolver(interactors.SearchCodes))
query.set_field("users", InteractorResolver(interactors.Users))

query.set_field("searchEntities", InteractorResolver(interactors.SearchEntities))

workspace.set_field("collections", InteractorResolver(interactors.WorkspaceCollections))


@workspace.field("shared")
def resolve_workspace_shared(workspace: d.Workspace, info) -> list[d.Collection]:
    session: Session = info.context["request"].scope["db_session"]
    user: d.User = info.context["request"].scope["user"]

    return session.collection_repository.get_shared_with(user)


@collection.field("items")
@phenotype.field("codelists")
def resolve_items(container: d.OrderedContainer, info) -> list[d.Codelist]:
    session = cast(Session, info.context["request"].scope["db_session"])

    get_all: Callable[[list], list]
    match container.item_type:
        case d.ItemType.Codelist:
            get_all = session.codelist_repository.get_all
        case d.ItemType.Phenotype:
            get_all = session.phenotype_repository.get_all
        case _:
            raise ValueError(
                f"Collection of type {container.item_type} is not supported"
            )

    items = get_all(container.item_ids)
    items.sort(key=lambda x: container.item_ids.index(x.id))

    return items


@codeset.field("ontology")
@changeset.field("ontology")
def resolve_ontology(o: d.Codeset | d.Changeset, info) -> d.Ontology:
    session: Session = info.context["request"].scope["db_session"]

    ontology = session.ontology_repository.get(o.ontology_id)
    assert ontology is not None  # Codeset/Changeset always belongs to an Ontology
    return ontology


@ontology.field("rootCodes")
@code.field("children")
def resolve_paged_codes(o: d.Ontology | d.Code, info, **kwargs) -> list[d.Code]:
    session: Session = info.context["request"].scope["db_session"]

    # If you only request the ids, you can set the page_size to -1
    # in order to get all ids without pagination.
    return_all_ids = False
    if get_sub_fields(info) == ["id"] and kwargs.get("page_size") == -1:
        return_all_ids = True
        del kwargs["page_size"]

    dto = PagedCodesDto(**kwargs)

    code_ids = []

    match o:
        case d.Ontology():
            code_ids = o.root_code_ids
        case d.Code():
            code_ids = o.children_ids

    if return_all_ids:
        return session.code_repository.get_all(code_ids)

    start_idx = 0
    if dto.start_cursor:
        start_idx = code_ids.index(dto.start_cursor) + 1

    end_idx = start_idx + dto.page_size
    paged_code_ids = code_ids[start_idx:end_idx]

    return session.code_repository.get_all(paged_code_ids)


@code.field("path")
@codeset.field("codes")
@changeset.field("added")
@changeset.field("removed")
def resolve_codes(
    o: d.Code | d.Codeset | d.Changeset, info
) -> Sequence[d.Code | dict[Literal["id"], int]]:
    session: Session = info.context["request"].scope["db_session"]

    code_ids = []

    match o:
        case d.Code():
            code_ids = o.path
        case d.Codeset():
            code_ids = list(o.code_ids)
        case d.Changeset():
            match info.field_name:
                case "added":
                    code_ids = list(o.code_ids_added)
                case "removed":
                    code_ids = list(o.code_ids_removed)

    sub_fields = get_sub_fields(info)

    # If only the id is requested, return a list of ids
    # This is a performance optimization to avoid loading the code objects
    if sub_fields == ["id"]:
        return [{"id": id_} for id_ in sorted(code_ids)]

    codes = session.code_repository.get_all(code_ids)
    codes.sort(key=lambda x: code_ids.index(x.id))
    return codes


@commit.field("author")
def resolve_commit_author(commit: d.Commit, info) -> d.Author:
    session: Session = info.context["request"].scope["db_session"]

    user = session.user_repository.get(commit.author_id)
    if user is None:
        return d.Author(
            id=session.user_repository.new_id(),
            external_id="00000",
            name="deleted user",
            workspace=d.Workspace(d.WorkspaceID(int=0)),
        )

    return d.Author.from_user(user)


@commit.field("createdAt")
def resolve_commit_created_at(commit: d.Commit, info) -> str:
    return commit.created_at.isoformat()


@code.field("parent")
def resolve_parent(code: d.Code, info) -> Optional[d.Code]:
    session: Session = info.context["request"].scope["db_session"]

    if code.parent_id is None:
        return None
    return session.code_repository.get(code.parent_id)


@code.field("numberOfChildren")
def resolve_code_number_of_children(code: d.Code, info):
    return len(code.children_ids)


@collection.field("sharedWith")
def resolve_collection_shared_with(
    collection: d.Collection, info
) -> Iterable[d.UserID]:
    return {u.id for u in collection.shared_with}
