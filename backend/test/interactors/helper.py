import uuid
from unittest import TestCase

import medconb.domain as d

from ..helper import _c_id, _cl_id, _u_id


def create_Collection(
    *,
    id=_c_id(1),
    name="Test Collection",
    description="Test Description",
    properties: dict = None,
    item_type=d.ItemType.Codelist,
    item_ids: list = None,
    shared_with: set = set(),
    _owner_id=_u_id(1),
    reference_id=None,
    locked=False,
):
    return d.Collection(
        id=id,
        name=name,
        description=description,
        properties=properties if properties else {},
        item_type=item_type,
        item_ids=item_ids if item_ids else [],
        shared_with=shared_with if shared_with else set(),
        _owner_id=_owner_id,
        reference_id=reference_id,
        locked=locked,
    )


def create_Codelist(
    id=_cl_id(42),
    name="CL",
    description="",
    commits: list = None,
    transient_commit=None,
    container=d.ContainerSpec(id=_c_id(1), type_=d.ContainerType.Collection),
    reference_id=None,
):
    return d.Codelist(
        id=id,
        name=name,
        description=description,
        commits=commits if commits else [],
        transient_commit=transient_commit,
        container=container,
        reference_id=reference_id,
    )


def create_Phenotype(
    id=_cl_id(42),
    name="Phenotype",
    medical_description="",
    operational_description="",
    properties: dict = None,
    container=d.ContainerSpec(id=_c_id(1), type_=d.ContainerType.Collection),
    item_ids: list = None,
    reference_id=None,
):
    return d.Phenotype(
        id=id,
        name=name,
        medical_description=medical_description,
        operational_description=operational_description,
        properties=properties if properties else {},
        container=container,
        item_ids=item_ids if item_ids else [],
        reference_id=reference_id,
    )


def assertDictEqual(d1, d2, msg=None):
    tc = TestCase()
    tc.maxDiff = None
    return tc.assertDictEqual(d1, d2, msg)


def assertListEqual(l1, l2, msg=None):
    tc = TestCase()
    tc.maxDiff = None
    return tc.assertListEqual(l1, l2, msg)


class MockSession:
    """
    This class implements the Session protocol from medconb.types and
    can be used to mock the session object.

    It enables the user to store objects to it and to act like a real
    session object.
    """

    def __init__(self):
        self._objects = {}

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass

    def add(self, obj):
        self._objects[(obj.id, obj.__class__)] = obj

    def get(self, type_, id_):
        return self._objects.get((id_, type_))

    def get_all(self, type_, ids_subset=None):
        if ids_subset is not None:
            return [
                o
                for (i, t), o in self._objects.items()
                if i in ids_subset and t == type_
            ]

        return [o for (_, t), o in self._objects.items() if t == type_]

    def delete(self, obj):
        del self._objects[(obj.id, obj.__class__)]

    def clear(self):
        self._objects.clear()

    def commit(self):
        pass

    # implement the required properties and methods of the Session protocol
    @property
    def user_repository(self):
        return NotImplemented

    @property
    def collection_repository(self):
        return self.Repository(self, d.Collection)

    @property
    def phenotype_repository(self):
        return self.Repository(self, d.Phenotype)

    @property
    def codelist_repository(self):
        return self.Repository(self, d.Codelist)

    @property
    def ontology_repository(self):
        return self.Repository(self, d.Ontology)

    @property
    def code_repository(self):
        return self.CodeRepository(self, d.Code)

    @property
    def property_repository(self):
        return NotImplemented

    class Repository:
        def __init__(self, session: "MockSession", type_):
            self._session = session
            self._type = type_

        def get(self, id_):
            return self._session.get(self._type, id_)

        def get_by(self, property: str, value):
            res = [
                o
                for o in self._session.get_all(self._type)
                if getattr(o, property) == value
            ]
            return res

        def get_all(self, ids_subset=None):
            return self._session.get_all(self._type, ids_subset)

        def new_id(self):
            return uuid.uuid4()

        def add(self, obj):
            self._session.add(obj)

        def delete(self, obj_id):
            self._session.delete(self.get(obj_id))

        def get_shared_with(self, id_):
            return self._session.get_shared_with(id_)

    class CodeRepository(Repository):
        def find_codes(
            self, codes: list[str], ontology_id: str | None = None
        ) -> dict[str, int | None]:
            res = {}
            for code in self.get_all():
                if ontology_id and code.ontology_id != ontology_id:
                    continue
                if code.code in codes:
                    res[code.code] = code.id
            return res
