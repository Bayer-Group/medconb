import os
import re
from enum import Enum
from typing import TYPE_CHECKING, Any, Generic, Optional, Type, TypeVar, cast

from plyse.query_tree import Not, Operand
from plyse.term_parser import Term
from sqlalchemy import Column, Select, and_, func, literal, not_, or_, select, text
from sqlalchemy.dialects.postgresql.base import PGCompiler
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import Mapped
from sqlalchemy.sql.expression import ClauseElement, Executable

import medconb.domain as d

from . import ontology_orm as t_o
from . import orm as t

if TYPE_CHECKING:  # pragma: no cover
    from plyse import Query
    from sqlalchemy.orm import Session


class Explain(Executable, ClauseElement):
    inherit_cache = False

    def __init__(self, stmt, analyze=False):
        self.statement = stmt
        self.analyze = analyze


@compiles(Explain)
def pg_explain(element, compiler: PGCompiler, **kw):
    text = "EXPLAIN "
    if element.analyze:
        text += "ANALYZE "
    text += compiler.process(element.statement, **kw)

    return text


class UserRepository:
    def __init__(self, session: "Session"):
        self.session = session

    def get(self, user_id: d.UserID) -> Optional[d.User]:
        return self.session.get(d.User, user_id)

    def get_all(
        self, user_ids: list[d.UserID] | None = None, include_system: bool = False
    ) -> list[d.User]:
        q = select(d.User)

        if not include_system:
            q = q.where(t.user.c.id != d.PUBLIC_USER_ID)

        if user_ids == []:
            return []
        elif user_ids:
            q = q.where(t.user.c.id.in_(user_ids))

        return list(self.session.scalars(q).all())

    def getByExternalID(self, external_id: str) -> Optional[d.User]:
        return self.session.scalar(
            select(d.User).where(t.user.c.external_id == external_id)
        )

    def new_id(self) -> d.UserID:
        return d.UserID(bytes=os.urandom(16), version=4)

    def new_workspace_id(self) -> d.WorkspaceID:
        return d.WorkspaceID(bytes=os.urandom(16), version=4)

    def lock(self) -> None:  # pragma: no cover
        self.session.execute(
            text(f'LOCK TABLE "{t.user.name}"'),
            bind_arguments={"mapper": d.User},
        )


class SearchResultVisibility(Enum):
    OWN = "own"
    SHARED = "shared"
    PUBLIC = "public"


T = TypeVar("T", d.Codelist, d.Phenotype, d.Collection)


class SearchQueryBuilderMixin(Generic[T]):
    # only use this class as a mixin for a class that provides `session`
    session: "Session"

    def build_search_query(
        self,
        query: "Query",
        root_collection_query: Select,
        user_id: d.UserID,
        page_size: int = 100,
        start_cursor: Optional[d.CollectionID | d.PhenotypeID | d.CodelistID] = None,
    ) -> tuple[Select, Select]:
        """
        build_search_query builds the query for executing the search
        on the database.
        It returns two versions of that query:
         1. one that is paged and can be used to get the actual results
         2. one that is not paged and can be used to get the total number
        """
        visibilities = self._parse_visibility(query)
        visibility_cte = self.build_candidate_cte(
            visibilities, user_id, root_collection_query
        )

        filter_clause = self.build_filter_clause(query)
        if filter_clause is None:
            filter_clause = literal(True, literal_execute=True)

        result_class: Type[T] = self._search_result_type()

        if page_size > 100:
            page_size = 100

        order_column = cast(Column, result_class.id)

        q = (
            select(result_class)
            .join(visibility_cte, onclause=visibility_cte.c.id == result_class.id)
            .where(filter_clause)
        )

        unpaged_query = q
        paged_query = q

        if start_cursor:
            paged_query = paged_query.where(order_column > start_cursor)

        paged_query = paged_query.order_by(order_column).limit(
            literal(page_size, literal_execute=True)
        )

        return paged_query, unpaged_query

    def build_filter_clause(self, query: "Query"):
        return self._do_traverse(query.query_as_tree)

    def build_candidate_cte(
        self,
        visibilities: list[SearchResultVisibility],
        user_id: d.UserID,
        root_collection_query: Select,
    ):
        """
        Returns a CTE object that contains the ids of all objects that
        could be results of a search query according to the given
        visibility criteria respective the given user id.

        For this, we create lists in forms of tables with the ids of
        all objects that are owned by the user or shared with the user.
        These lists are then used to subset

        For all of them we use the recursive query that finds the
        root collection for an object, as the permissions for an
        object are inherited from its containing collection.

        For the owner column we join with the workspace table.
        For the shared column we use the share table.
        """
        if not visibilities:
            raise ValueError(
                "No valid visibility specified. Select from "
                + ", ".join(SearchResultVisibility._member_names_)
                + "."
            )

        root_collection_cte = root_collection_query.cte(name="root_collection")

        ownership_subquery = (
            select(func.unnest(t.workspace.c.collection_ids).label("collection_id"))
            .where(t.workspace.c.user_id == user_id)
            .subquery(name="ownership")
        )
        shared_subquery = (
            select(t.share.c.collection_id)
            .where(t.share.c.user_id == user_id)
            .subquery(name="shared")
        )
        public_subquery = (
            select(t.share.c.collection_id)
            .where(t.share.c.user_id == d.PUBLIC_USER_ID)
            .subquery(name="public")
        )

        visibility_query = (
            select(root_collection_cte.c.id)
            .outerjoin(
                ownership_subquery,
                onclause=root_collection_cte.c.container_id
                == ownership_subquery.c.collection_id,
            )
            .outerjoin(
                shared_subquery,
                onclause=root_collection_cte.c.container_id
                == shared_subquery.c.collection_id,
            )
            .outerjoin(
                public_subquery,
                onclause=root_collection_cte.c.container_id
                == public_subquery.c.collection_id,
            )
        )

        visibility_subquery_filter: list[Any] = [False]

        if SearchResultVisibility.OWN in visibilities:
            visibility_subquery_filter.append(
                ownership_subquery.c.collection_id.is_not(None)
            )

        if SearchResultVisibility.SHARED in visibilities:
            visibility_subquery_filter.append(
                shared_subquery.c.collection_id.is_not(None)
            )

        if SearchResultVisibility.PUBLIC in visibilities:
            visibility_subquery_filter.append(
                public_subquery.c.collection_id.is_not(None)
            )

        return visibility_query.where(or_(*visibility_subquery_filter)).cte(
            name="visibility"
        )

    def _root_collection_query(self) -> Select:
        """
        Returns a select statement representing a mapping table that
        gives the root collection (container_id) for each object id of
        the given type (phenotype, codelist).

        The select uses recursive CTEs, so it might not be usable for
        every purpose and it can be expensive.
        """
        object_type: Type[T] = self._search_result_type()

        if object_type not in [d.Phenotype, d.Codelist]:
            raise ValueError("Only Phenotype and Codelist are supported.")

        _cte = (
            select(
                t.container_item.c.id,
                t.container_item.c.container_id,
                literal(0, literal_execute=True).label("depth"),
            )
            .where(t.container_item.c.type_ == object_type.__name__)
            .cte("rec_cte", recursive=True)
        )
        cte = _cte.union_all(
            select(
                _cte.c.id,
                t.container_item.c.container_id,
                (_cte.c.depth + literal(1, literal_execute=True)).label("depth"),
            )
            .select_from(_cte)
            .join(t.container_item, _cte.c.container_id == t.container_item.c.id)
        )
        inner = select(
            cte,
            func.row_number()
            .over(partition_by=cte.c.id, order_by=cte.c.depth.desc())
            .label("rn"),
        )

        return select(inner.c.id, inner.c.container_id).where(
            inner.c.rn == literal(1, literal_execute=True)
        )

    def _do_traverse(self, node):
        if node.is_leaf:
            return self._leaf_callback(node)
        elif isinstance(node, Not):
            return not_(self._do_traverse(node.inputs[0]))

        return self._node_callback(node)

    def _node_callback(self, node):
        match node.type:
            case "and":
                left = self._do_traverse(node.inputs[0])
                right = self._do_traverse(node.inputs[1])

                if left is None:
                    return right

                if right is None:
                    return left

                return and_(left, right)
            case "or":
                left = self._do_traverse(node.inputs[0])
                right = self._do_traverse(node.inputs[1])

                if left is None:
                    return right

                if right is None:
                    return left

                return or_(left, right)
            case _:
                raise ValueError(f"Unknown node type: {node.type}")

    @staticmethod
    def _search_config() -> dict[str, dict[str, Any]]:
        return NotImplemented

    @staticmethod
    def _search_result_type() -> Type[T]:
        return NotImplemented

    def _leaf_callback(self, leaf: Operand):
        allowed_columns = self._search_config()["freetext_fields"]
        columns = []

        if leaf["field_type"] == Term.ATTRIBUTE:
            if leaf["field"] not in allowed_columns:
                return None

            columns.append(allowed_columns[leaf["field"]])

        if len(columns) == 0:
            columns = list(allowed_columns.values())

        if leaf["val_type"] == "partial_string":
            return or_(*[col.ilike("%" + leaf["val"] + "%") for col in columns])
        else:
            return or_(
                *[
                    col.regexp_match(
                        "(^|[[:space:]]+)" + leaf["val"] + "([[:space:]]+|$)", flags="i"
                    )
                    for col in columns
                ]
            )

    def _parse_visibility(self, query: "Query") -> list[SearchResultVisibility]:
        dirty = next(
            (t["val"] for t in query.terms() if t.get("field", None) == "visibility"),
            "own,shared,public",  # TODO: change to public when implemented
        ).split(",")
        return [
            SearchResultVisibility(c.strip().lower())
            for c in dirty
            if c.upper() in SearchResultVisibility._member_names_
        ] or [SearchResultVisibility.PUBLIC]

    def estimate_number_of_results(self, stmt: Select) -> int:
        explain_res: str = self.session.scalar(Explain(stmt))
        match = re.search(r"rows=(\d+)", explain_res)

        if match is None:
            raise ValueError("Could not get total number of results")

        count_estimated = int(match.group(1))

        if count_estimated >= 1000:
            return count_estimated

        count_exact = cast(
            int, self.session.scalar(select(func.count()).select_from(stmt.subquery()))
        )

        return count_exact


class CollectionRepository(SearchQueryBuilderMixin[d.Collection]):
    def __init__(self, session: "Session"):
        self.session = session

    def get(
        self, collection_id: d.CollectionID
    ) -> Optional[d.Collection]:  # pragma: no cover
        return self.session.get(d.Collection, collection_id)

    def get_all(self, collection_ids: list[d.CollectionID]) -> list[d.Collection]:
        res = self.session.scalars(
            select(d.Collection).where(t.collection.c.id.in_(collection_ids))
        ).all()
        return list(res)

    def get_shared_with(self, user: d.User) -> list[d.Collection]:
        res = self.session.scalars(
            select(d.Collection)
            .join(t.share, t.share.c.collection_id == d.Collection.id)
            .where(t.share.c.user_id == user.id)
        ).all()
        return list(res)

    def new_id(self) -> d.CollectionID:
        return d.CollectionID(bytes=os.urandom(16), version=4)

    def search(
        self,
        query: "Query",
        item_type: d.ItemType,
        user_id: d.UserID,
        page_size: int = 100,
        start_cursor: Optional[Optional[d.CollectionID]] = None,
    ) -> tuple[list[d.Collection], int]:
        root_collection_query = select(
            t.collection.c.id, t.collection.c.id.label("container_id")
        ).where(t.collection.c.item_type == literal(item_type, literal_execute=True))

        paged_stmt, unpaged_stmt = self.build_search_query(
            query=query,
            root_collection_query=root_collection_query,
            user_id=user_id,
            page_size=page_size,
            start_cursor=start_cursor,
        )

        items = list(self.session.scalars(paged_stmt).all())
        number_of_rows = self.estimate_number_of_results(unpaged_stmt)

        return items, number_of_rows

    @staticmethod
    def _search_result_type() -> Type[d.Collection]:
        return d.Collection

    @staticmethod
    def _search_config():
        return {
            "freetext_fields": {
                "name": t.collection.c.name,
                "description": t.collection.c.description,
            }
        }


class PhenotypeRepository(SearchQueryBuilderMixin[d.Phenotype]):
    def __init__(self, session: "Session"):
        self.session = session

    def get(
        self, phenotype_id: d.PhenotypeID
    ) -> Optional[d.Phenotype]:  # pragma: no cover
        return self.session.get(d.Phenotype, phenotype_id)

    def get_by(self, property: str, value: Any) -> list[d.Phenotype]:
        return list(
            self.session.scalars(
                select(d.Phenotype).where(getattr(d.Phenotype, property) == value)
            ).all()
        )

    def get_all(self, phenotype_id: list[d.PhenotypeID]) -> list[d.Phenotype]:
        res = self.session.scalars(
            select(d.Phenotype).where(t.phenotype.c.id.in_(phenotype_id))
        ).all()
        return list(res)

    def delete(self, phenotype_id: d.PhenotypeID) -> None:
        self.session.delete(self.get(phenotype_id))

    def new_id(self) -> d.PhenotypeID:
        return d.PhenotypeID(bytes=os.urandom(16), version=4)

    def search(
        self,
        query: "Query",
        user_id: d.UserID,
        page_size: int = 100,
        start_cursor: Optional[d.PhenotypeID] = None,
    ) -> tuple[list[d.Phenotype], int]:
        paged_stmt, unpaged_stmt = self.build_search_query(
            query=query,
            root_collection_query=self._root_collection_query(),
            user_id=user_id,
            page_size=page_size,
            start_cursor=start_cursor,
        )

        items = list(self.session.scalars(paged_stmt).all())
        number_of_rows = self.estimate_number_of_results(unpaged_stmt)

        return items, number_of_rows

    @staticmethod
    def _search_result_type() -> Type[d.Phenotype]:
        return d.Phenotype

    @staticmethod
    def _search_config():
        return {
            "freetext_fields": {
                "name": t.phenotype.c.name,
                "medical_description": t.phenotype.c.medical_description,
                "operational_description": t.phenotype.c.operational_description,
            }
        }


class PropertyRepository:
    def __init__(self, session: "Session"):
        self.session = session

    def get(
        self, property_id: d.PropertyID
    ) -> Optional[d.Property]:  # pragma: no cover
        return self.session.get(d.Property, property_id)

    def get_all(self, class_: d.PropertyClass | None) -> list[d.Property]:
        stmt = select(d.Property)
        if class_ is not None:
            stmt = stmt.where(t.property_.c.class_name == class_)

        return list(self.session.scalars(stmt).all())


class CodelistRepository(SearchQueryBuilderMixin[d.Codelist]):
    def __init__(self, session: "Session"):
        self.session = session

    def get(
        self, codelist_id: d.CodelistID
    ) -> Optional[d.Codelist]:  # pragma: no cover
        return self.session.get(d.Codelist, codelist_id)

    def get_by(self, property: str, value: Any) -> list[d.Codelist]:
        return list(
            self.session.scalars(
                select(d.Codelist).where(getattr(d.Codelist, property) == value)
            )
            .unique()
            .all()
        )

    def get_all(self, codelist_ids: list[d.CodelistID]) -> list[d.Codelist]:
        return list(
            self.session.scalars(
                select(d.Codelist).where(t.codelist.c.id.in_(codelist_ids))
            )
            .unique()
            .all()
        )

    def delete(self, codelist_id: d.CodelistID) -> None:  # pragma: no cover
        self.session.delete(self.get(codelist_id))

    def new_id(self) -> d.CodelistID:
        return d.CodelistID(bytes=os.urandom(16), version=4)

    def search(
        self,
        query: "Query",
        user_id: d.UserID,
        page_size: int = 100,
        start_cursor: Optional[d.CodelistID] = None,
    ) -> tuple[list[d.Codelist], int]:
        paged_stmt, unpaged_stmt = self.build_search_query(
            query=query,
            root_collection_query=self._root_collection_query(),
            user_id=user_id,
            page_size=page_size,
            start_cursor=start_cursor,
        )

        items = list(self.session.scalars(paged_stmt).unique().all())
        number_of_rows = self.estimate_number_of_results(unpaged_stmt)

        return items, number_of_rows

    @staticmethod
    def _search_result_type() -> Type[d.Codelist]:
        return d.Codelist

    @staticmethod
    def _search_config():
        return {
            "freetext_fields": {
                "name": t.codelist.c.name,
                "description": t.codelist.c.description,
            }
        }


class OntologyRepository:
    def __init__(self, session: "Session"):
        self.session = session

    def get(self, ontology_id: str) -> Optional[d.Ontology]:  # pragma: no cover
        return self.session.get(d.Ontology, ontology_id)

    def get_all(self, ids_subset: Optional[list[str]] = None) -> list[d.Ontology]:
        if ids_subset:
            res = self.session.scalars(
                select(d.Ontology).where(t_o.ontology.c.id.in_(ids_subset))
            ).all()
        else:
            res = self.session.scalars(select(d.Ontology)).all()
        return list(res)


class CodeRepository:
    def __init__(self, session: "Session"):
        self.session = session

    def get(self, code_id: int) -> Optional[d.Code]:  # pragma: no cover
        return self.session.get(d.Code, code_id)

    def get_all(self, code_ids: list[int]) -> list[d.Code]:  # pragma: no cover
        return list(
            self.session.scalars(
                select(d.Code).where(t_o.code.c.id.in_(code_ids))
            ).all()
        )

    def find_codes(
        self, codes: list[str], ontology_id: str | None = None
    ) -> dict[str, int | None]:
        t_code: Any = t_o.code
        if ontology_id:
            t_code = (
                select(t_o.code).where(t_o.code.c.ontology_id == ontology_id).subquery()
            )

        in_codes = func.unnest(codes).table_valued("code")
        res = self.session.execute(
            select(in_codes.column.label("code"), t_code.c.id).join(
                t_code, isouter=True, onclause=(in_codes.column == t_code.c.code)
            )
        ).all()

        return {r.code: r.id for r in res}

    def search_codes(  # noqa R901 - too complex
        self, query_data: d.QueryData, ontology_id: str
    ) -> list[d.Code]:
        assert isinstance(d.Code.id, Mapped)
        assert isinstance(d.Code.path, Mapped)
        assert isinstance(d.Code.description, Mapped)
        assert isinstance(d.Code.code, Mapped)

        filters = []
        if query_data.description:
            if any(c in query_data.description for c in ["%", "?"]):
                filters.append(d.Code.description.ilike(query_data.description))
            else:
                filters.append(d.Code.description.ilike(f"%{query_data.description}%"))
        match query_data.code:
            case d.CodeSearchParam(type=d.CodeSearchParamType.ILIKE):
                filters.append(d.Code.code.ilike(query_data.code.value))
            case d.CodeSearchParam(type=d.CodeSearchParamType.POSIX):
                filters.append(d.Code.code.regexp_match(query_data.code.value))

        if not filters:
            return []

        stmt = (
            select(
                d.Code.id,
                d.Code.code,
                d.Code.ontology_id,
                d.Code.description,
                d.Code.path,
                d.Code.children_ids,
                d.Code.last_descendant_id,
            )
            .where(d.Code.ontology_id == ontology_id)
            .where(*filters)
            .order_by(d.Code.id)
        )

        # I use this hack (instead of getting Code objects directly),
        # so it is assured that the objects are read only.
        # There might be a better way within sqlalchemy.
        return [d.Code(**row._mapping) for row in self.session.execute(stmt).all()]
