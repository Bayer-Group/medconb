from ariadne import (
    EnumType,
    load_schema_from_path,
    make_executable_schema,
    snake_case_fallback_resolvers,
)

import medconb.domain as d

from . import mutation, query

type_defs = load_schema_from_path("./schema.graphql")

schema = make_executable_schema(
    type_defs,
    query.query,
    query.user,
    query.workspace,
    query.collection,
    query.phenotype,
    query.codelist,
    query.property,
    query.ontology,
    query.codeset,
    query.commit,
    query.changeset,
    query.code,
    query.container_item,
    query.container_spec,
    query.search_result_item,
    mutation.mutation,
    EnumType("QueryDataCodeType", d.CodeSearchParamType),
    EnumType("ItemType", d.ItemType),
    EnumType("ContainerType", d.ContainerType),
    EnumType("PropertyClass", d.PropertyClass),
    EnumType("PropertyDType", d.PropertyDtype),
    EnumType("ContainerVisibility", d.CollectionVisibility),
    snake_case_fallback_resolvers,
)
