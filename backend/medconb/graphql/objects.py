"""Example Google style docstrings.

This module demonstrates documentation as specified by the `Google Python
Style Guide`_. Docstrings may extend over multiple lines. Sections are created
with a section header and a colon followed by a block of indented text.

Example:
    Examples can be given using either the ``Example`` or ``Examples``
    sections. Sections support any reStructuredText formatting, including
    literal blocks::

        $ python example_google.py

Section breaks are created by resuming unindented text. Section breaks
are also implicitly created anytime a new section starts.

Attributes:
    module_level_variable1 (int): Module level variables may be documented in
        either the ``Attributes`` section of the module docstring, or in an
        inline docstring immediately following the variable.

        Either form is acceptable, but the two should not be mixed. Choose
        one convention to document module level variables and be consistent
        with it.

Todo:
    * For module TODOs
    * You have to also use ``sphinx.ext.todo`` extension

.. _Google Python Style Guide:
   http://google.github.io/styleguide/pyguide.html

"""

import inspect
import logging
from functools import wraps
from typing import Any, Optional, Type, TypeVar

from ariadne import convert_camel_case_to_snake, convert_kwargs_to_snake_case
from ariadne.objects import ObjectType as _ObjectType
from ariadne.types import GraphQLResolveInfo, Resolver
from graphql.type import GraphQLField
from pydantic import BaseModel

from .helper import InteractorResolver, NeedsParent

logger = logging.getLogger(__name__)


T_out = TypeVar("T_out")
T_obj = TypeVar("T_obj", bound=Type)


class ObjectType(_ObjectType):
    def __init__(self, name: str, type_: Type | None = None) -> None:
        """
        The additional parameter `type_` maps this Object to a python
        Type (e.g. a class). Every Interactor that receives a
        parent object may be checked for type safety against `type_`.
        """
        super().__init__(name)
        self.type_ = type_

    def bind_resolvers_to_graphql_type(
        self, graphql_type, replace_existing=True
    ) -> None:
        for field_name, resolver in self._resolvers.items():
            if field_name not in graphql_type.fields:
                raise ValueError(
                    "Field %s is not defined on type %s" % (field_name, self.name)
                )

            field: GraphQLField = graphql_type.fields[field_name]

            if not (field.resolve is None or replace_existing):
                continue

            mapped_resolver = convert_kwargs_to_snake_case(resolver)

            if isinstance(resolver, InteractorResolver):
                mapped_resolver = self._convert_resolver_to_InteractorResolver(
                    resolver, field, field_name
                )
            else:
                logger.warning(
                    f"The resolver of Field '{self.name}.{field_name}' does not use"
                    " an InteractorResolver"
                )

            field.resolve = mapped_resolver

    def _convert_resolver_to_InteractorResolver(
        self,
        resolver: InteractorResolver[Type[BaseModel] | None, T_out, T_obj],
        # resolver: InteractorResolver[Type[BaseModel] | None, T_out],
        field: GraphQLField,
        field_name: str,
    ) -> Resolver:
        """
        Creates a plain graphql resolver with (possibly) kwargs, that
        maps to the strict interface of a InteractorResolver which
        accepts only a DTO (or None) as parameter.
        """
        sig = inspect.signature(resolver.interactor.__call__)
        dto_in: Type[BaseModel] | None = getattr(
            sig.parameters.get("dto", None), "annotation", None
        )

        # Checking T_out against the schema would require a custom logic
        # rendering the whole graphql spec against a type, similar to
        # how `graphql.ExecutionContext.complete_value` drills down
        # during execution of a query.
        dto_out: T_out = sig.return_annotation  # noqa - unused, just for type checking

        if isinstance(resolver.interactor, NeedsParent):
            self._typecheck_parent(
                resolver.interactor, resolver.parent_type, field_name
            )

        self.validate_graphql_args(field_name, field, dto_in)

        if dto_in is None:
            # validate_graphql_args made sure that there are no kwargs
            return resolver

        return self._wrap_resolver_with_kwargs(resolver, dto_in)

    def _typecheck_parent(  # noqa - R901 too complex 12 [radon]
        self, interactor: NeedsParent[T_obj], parent_type: Type, field_name: str
    ):
        sig = inspect.signature(interactor.set_parent)
        req_type: T_obj = sig.parameters["obj"].annotation

        if req_type is inspect.Parameter.empty:
            raise ValueError(
                f"The field '{self.name}.{field_name}' is resolved by the"
                f" Interactor {repr(interactor)} which expects a parent object but does"
                f" not declare in its signature what type it expects."
            )

        match (
            self.type_,
            parent_type,
            self.type_ is None or self.type_ == parent_type,
        ):
            case (None, None, _):
                raise ValueError(
                    f"The field '{self.name}.{field_name}' is resolved by the"
                    f" Interactor {repr(interactor)} which expects a parent object of"
                    f" ('{self.name}') type {repr(req_type)} but neither the graphql"
                    " type itself nor the corresponding InteractorResolver are mapped"
                    " to a type."
                )
            case (_, None, _):
                if not issubclass(self.type_, req_type):
                    raise ValueError(
                        f"The field '{self.name}.{field_name}' is resolved by the"
                        f" Interactor {repr(interactor)} which expects a parent object"
                        f" of type {repr(req_type)}, but the graphql type"
                        f"  ('{self.name}') maps to the conflicting input type"
                        f" {repr(self.type_)}."
                    )
            case (_, _, True):
                if not issubclass(parent_type, req_type):
                    raise ValueError(
                        f"The field '{self.name}.{field_name}' is resolved by the"
                        f" Interactor {repr(interactor)} which expects a parent object"
                        f" of type {repr(req_type)}, but the InteractorResolver maps to"
                        f" the conflicting input type {repr(parent_type)}."
                    )
            case (_, _, False):
                if (
                    self.type_ is not None
                    and parent_type is not None
                    and self.type_ != parent_type
                ):
                    raise ValueError(
                        f"The field '{self.name}.{field_name}' is resolved by the"
                        f" Interactor {repr(interactor)} which expects a parent object"
                        f" of type {repr(req_type)}. However, the InteractorResolver"
                        f" and the graphql type ('{self.name}') map to conflicting"
                        f" input types{repr(parent_type)} and"
                        f" {repr(self.type_)} respectively."
                    )

    def _wrap_resolver_with_kwargs(self, resolver: Resolver, dto: Type[BaseModel]):
        @convert_kwargs_to_snake_case
        @wraps(resolver)
        def wrapper(obj: Any, info: GraphQLResolveInfo, /, **kwargs):
            return resolver(obj, info, dto(**kwargs))

        return wrapper

    def validate_graphql_args(
        self, field_name: str, field: GraphQLField, dto_in: Optional[Type[BaseModel]]
    ):
        """
        Validates if the arguments to `field` are represented in the DTO
        object `dto`. It does not check the types, as this is complex
        and done at runtime by pydantic.
        """
        if len(field.args) == 0:
            if dto_in is not None:
                raise ValueError(
                    "There mustn't be a DTO defined on the argumentless Field "
                    f"'{self.name}.{field_name}'"
                )
            else:
                return

        if dto_in is None:
            raise ValueError(
                "There is no DTO defined on the argument-having Field "
                f"'{self.name}.{field_name}'"
            )

        dto_sig = inspect.signature(dto_in)

        names_gql = set(map(convert_camel_case_to_snake, field.args.keys()))
        names_dto = set(dto_sig.parameters.keys())

        missing_hard = names_gql - names_dto
        if missing_hard:
            raise ValueError(
                "The arguments '%s' on Field"
                f" '{self.name}.{field_name}' are not represented"
                f" in the assigned DTO '{repr(dto_in)}'" % "', '".join(missing_hard)
            )

        missing_soft = names_dto - names_gql
        if missing_soft:
            logger.warning(
                f"The properties '%s' on the DTO '{repr(dto_in)}' assigned to the Field"
                f" '{self.name}.{field_name}' do not exist on the GraphQL Field",
                "', '".join(missing_soft),
            )


class QueryType(ObjectType):
    """Convenience class for defining Query type"""

    def __init__(self) -> None:
        super().__init__("Query")


class MutationType(ObjectType):
    """Convenience class for defining Mutation type"""

    def __init__(self) -> None:
        super().__init__("Mutation")
