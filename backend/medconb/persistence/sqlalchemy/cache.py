import os
import time
from typing import TYPE_CHECKING, Optional, cast

from sqlalchemy import func, select

import medconb.domain as d

from . import ontology_orm as t_o
from .repositories import CodeRepository

if TYPE_CHECKING:  # pragma: no cover
    from redis import Redis as Client
    from sqlalchemy.orm import Session, sessionmaker


class CachedCodeRepository:  # pragma: no cover
    def __init__(self, sm: "sessionmaker", client: "Client"):
        """
        CachedCodeRepository is different to the other repositories as
        it does not get created per request and session but just once.
        This is because it holds the connection to the cache which needs
        to be warmed up once at the startup of the service.

        As CachedCodeRepository still uses the non-cached
        CodeRepository for filtering (done in SQL) and so it
        satisfies the way repositories are created (called/initialized
        with the current session), the __call__ method of this class
        serves as the entry point for request scoped use.
        """
        self._client = client
        self._sm = sm
        with sm() as session:
            session = cast(Session, session) if TYPE_CHECKING else session
            self._ontologies = session.scalars(select(t_o.ontology.c.id)).all()
        self.session: "Session" | None = None

    def __call__(self, session: "Session") -> "CachedCodeRepository":
        """
        Is called when this repository is used within a context of a
        request to set the currently active sql session.
        """
        self.session = session
        return self

    async def warmup(self) -> None:
        while True:
            try:
                with open("/tmp/medconb.lock.warmup", "x"):
                    # # to not constantly warming up the cache in development
                    # self._client.set("is_hot", 1, ex=1)
                    if self._client.get("is_hot"):
                        print(f"[{os.getpid()}] Cache already warmed up")
                    else:
                        print(f"[{os.getpid()}] Warming up cache")
                        with self._sm() as session:
                            self._warmup_cache(session)
                        self._client.set("is_hot", 1, ex=5 * 60)
                os.remove("/tmp/medconb.lock.warmup")
                break
            except FileExistsError:
                time.sleep(3)

    def _warmup_cache(self, session: "Session"):
        self._client.flushdb(True)

        max_id = session.scalars(select(func.max(t_o.code.c.id))).one()
        limit = 10000
        counter = 0

        for offset in range(0, max_id, limit):
            codes: list[d.Code] = list(
                session.scalars(
                    select(d.Code).where(
                        (t_o.code.c.id > offset) & (t_o.code.c.id <= offset + limit)
                    )
                ).all()
            )

            if len(codes) == 0:
                continue

            self._client.mset({f"c|{c.id}": c.serialize() for c in codes})
            self._client.mset(
                {f"l|{c.ontology_id}|{c.code.lower()}": c.id for c in codes}
            )

            counter += len(codes)

        print("Cached", counter, "codes")

    def get(self, code_id: int) -> Optional[d.Code]:
        data = self._client.get(f"c|{code_id}")
        return d.Code.deserialize(data) if data else None

    def get_all(self, code_ids: list[int]) -> list[d.Code]:
        data = self._client.mget([f"c|{id_}" for id_ in code_ids])
        return list(map(d.Code.deserialize, filter(None, data)))

    def find_codes(
        self, codes: list[str], ontology_id: str | None = None
    ) -> dict[str, int | None]:
        res = {}
        for o in self._ontologies:
            if ontology_id and o != ontology_id:
                continue
            for code in codes:
                data = self._client.get(f"l|{o}|{code.lower()}")
                res[code] = int(data) if data else None

        return res

    def search_codes(self, query_data: d.QueryData, ontology_id: str) -> list[d.Code]:
        assert self.session is not None
        return CodeRepository(self.session).search_codes(query_data, ontology_id)


class CachedPropertyRepository:
    def __init__(self, sm: "sessionmaker"):
        """@see CachedCodeRepository"""
        self._sm = sm
        self.session: "Session" | None = None

        with sm() as session:
            self.session = session
            self._refresh_cache()

        self.session = None

    def __call__(self, session: "Session") -> "CachedPropertyRepository":
        """
        Is called when this repository is used within a context of a
        request to set the currently active sql session.
        """
        self.session = session
        return self

    def _refresh_cache(self) -> None:
        assert self.session is not None

        self._properties: list[d.Property] = list(
            map(
                lambda p: d.Property(
                    id=p.id,
                    name=p.name,
                    class_name=p.class_name,
                    dtype=p.dtype,
                    dtype_meta=p.dtype_meta,
                    required=p.required,
                    read_only=p.read_only,
                ),
                self.session.scalars(select(d.Property)).all(),
            )
        )
        self._property_map = {p.id: p for p in self._properties}
        self._expires_at = time.time() + 60 * 10  # 10min
        print(
            f"Cached {len(self._properties)} properties: "
            + str([p.name for p in self._properties])
        )

    def _cache_is_expired(self) -> bool:
        return time.time() > self._expires_at

    def get(
        self, property_id: d.PropertyID
    ) -> Optional[d.Property]:  # pragma: no cover
        if self._cache_is_expired():
            self._refresh_cache()

        return self._property_map[property_id]

    def get_all(self, class_: d.PropertyClass | None) -> list[d.Property]:
        if self._cache_is_expired():
            self._refresh_cache()

        if class_:
            return list(filter(lambda p: p.class_name == class_, self._properties))

        return self._properties
