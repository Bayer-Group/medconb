import csv
from io import StringIO

import pytest

import medconb.domain as d
import medconb.graphql.types as gql
from medconb.interactors import (
    CloneCodelist,
    CodelistNotExistsException,
    ContainerNotExistsException,
    CreateCodelist,
    DeleteCodelist,
    ImportCodelists,
    MoveCodelist,
    UpdateCodelist,
)
from medconb.types import Session

from ..helper import _c_id, _cl_id, _cl_ids, _u_id
from .helper import MockSession, assertListEqual, create_Codelist, create_Collection

code_data = """id,code,ontology_id,description,path,children_ids,last_descendant_id
23294,A00-B99,ICD-10-CM,Certain infectious and parasitic diseases (A00-B99),{23294},"{23295}",23345
23295,A00-A09,ICD-10-CM,Intestinal infectious diseases (A00-A09),"{23294}","{23296,23300,23313,23326,23333}",23345
23296,A00,ICD-10-CM,Cholera,"{23294,23295,23296}","{23297,23298,23299}",23299
23297,"A00.0",ICD-10-CM,"Cholera due to Vibrio cholerae 01, biovar cholerae","{23294,23295,23296,23297}",{},23297
23298,A00.1,ICD-10-CM,"Cholera due to Vibrio cholerae 01, biovar eltor","{23294,23295,23296,23298}",{},23298
23299,A00.9,ICD-10-CM,"Cholera, unspecified","{23294,23295,23296,23299}",{},23299
23300,A01,ICD-10-CM,Typhoid and paratyphoid fevers,"{23294,23295,23300}","{23301,23309,23310,23311,23312}",23312
23301,"A01.0",ICD-10-CM,Typhoid fever,"{23294,23295,23300,23301}","{23302,23303,23304,23305,23306,23307,23308}",23308
23302,"A01.00",ICD-10-CM,"Typhoid fever, unspecified","{23294,23295,23300,23301,23302}",{},23302
23303,A01.01,ICD-10-CM,Typhoid meningitis,"{23294,23295,23300,23301,23303}",{},23303
23304,A01.02,ICD-10-CM,Typhoid fever with heart involvement,"{23294,23295,23300,23301,23304}",{},23304
23305,A01.03,ICD-10-CM,Typhoid pneumonia,"{23294,23295,23300,23301,23305}",{},23305
23306,A01.04,ICD-10-CM,Typhoid arthritis,"{23294,23295,23300,23301,23306}",{},23306
23307,A01.05,ICD-10-CM,Typhoid osteomyelitis,"{23294,23295,23300,23301,23307}",{},23307
23308,A01.09,ICD-10-CM,Typhoid fever with other complications,"{23294,23295,23300,23301,23308}",{},23308
23309,A01.1,ICD-10-CM,Paratyphoid fever A,"{23294,23295,23300,23309}",{},23309
23310,A01.2,ICD-10-CM,Paratyphoid fever B,"{23294,23295,23300,23310}",{},23310
23311,A01.3,ICD-10-CM,Paratyphoid fever C,"{23294,23295,23300,23311}",{},23311
23312,A01.4,ICD-10-CM,"Paratyphoid fever, unspecified","{23294,23295,23300,23312}",{},23312
23313,A02,ICD-10-CM,Other salmonella infections,"{23294,23295,23313}","{23314,23315,23316,23324,23325}",23325
23314,"A02.0",ICD-10-CM,Salmonella enteritis,"{23294,23295,23313,23314}",{},23314
23315,A02.1,ICD-10-CM,Salmonella sepsis,"{23294,23295,23313,23315}",{},23315
23316,A02.2,ICD-10-CM,Localized salmonella infections,"{23294,23295,23313,23316}","{23317,23318,23319,23320,23321,23322,23323}",23323
23317,"A02.20",ICD-10-CM,"Localized salmonella infection, unspecified","{23294,23295,23313,23316,23317}",{},23317
23318,A02.21,ICD-10-CM,Salmonella meningitis,"{23294,23295,23313,23316,23318}",{},23318
23319,A02.22,ICD-10-CM,Salmonella pneumonia,"{23294,23295,23313,23316,23319}",{},23319
23320,A02.23,ICD-10-CM,Salmonella arthritis,"{23294,23295,23313,23316,23320}",{},23320
23321,A02.24,ICD-10-CM,Salmonella osteomyelitis,"{23294,23295,23313,23316,23321}",{},23321
23322,A02.25,ICD-10-CM,Salmonella pyelonephritis,"{23294,23295,23313,23316,23322}",{},23322
23323,A02.29,ICD-10-CM,Salmonella with other localized infection,"{23294,23295,23313,23316,23323}",{},23323
23324,A02.8,ICD-10-CM,Other specified salmonella infections,"{23294,23295,23313,23324}",{},23324
23325,A02.9,ICD-10-CM,"Salmonella infection, unspecified","{23294,23295,23313,23325}",{},23325
23326,A03,ICD-10-CM,Shigellosis,"{23294,23295,23326}","{23327,23328,23329,23330,23331,23332}",23332
23327,"A03.0",ICD-10-CM,Shigellosis due to Shigella dysenteriae,"{23294,23295,23326,23327}",{},23327
23328,A03.1,ICD-10-CM,Shigellosis due to Shigella flexneri,"{23294,23295,23326,23328}",{},23328
23329,A03.2,ICD-10-CM,Shigellosis due to Shigella boydii,"{23294,23295,23326,23329}",{},23329
23330,A03.3,ICD-10-CM,Shigellosis due to Shigella sonnei,"{23294,23295,23326,23330}",{},23330
23331,A03.8,ICD-10-CM,Other shigellosis,"{23294,23295,23326,23331}",{},23331
23332,A03.9,ICD-10-CM,"Shigellosis, unspecified","{23294,23295,23326,23332}",{},23332
23333,A04,ICD-10-CM,Other bacterial intestinal infections,"{23294,23295,23333}","{23334,23335,23336,23337,23338,23339,23340,23341,23344,23345}",23345
23334,"A04.0",ICD-10-CM,Enteropathogenic Escherichia coli infection,"{23294,23295,23333,23334}",{},23334
23335,A04.1,ICD-10-CM,Enterotoxigenic Escherichia coli infection,"{23294,23295,23333,23335}",{},23335
23336,A04.2,ICD-10-CM,Enteroinvasive Escherichia coli infection,"{23294,23295,23333,23336}",{},23336
23337,A04.3,ICD-10-CM,Enterohemorrhagic Escherichia coli infection,"{23294,23295,23333,23337}",{},23337
23338,A04.4,ICD-10-CM,Other intestinal Escherichia coli infections,"{23294,23295,23333,23338}",{},23338
23339,A04.5,ICD-10-CM,Campylobacter enteritis,"{23294,23295,23333,23339}",{},23339
23340,A04.6,ICD-10-CM,Enteritis due to Yersinia enterocolitica,"{23294,23295,23333,23340}",{},23340
23341,A04.7,ICD-10-CM,Enterocolitis due to Clostridium difficile,"{23294,23295,23333,23341}","{23342,23343}",23343
23342,A04.71,ICD-10-CM,"Enterocolitis due to Clostridium difficile, recurrent","{23294,23295,23333,23341,23342}",{},23342
23343,A04.72,ICD-10-CM,"Enterocolitis due to Clostridium difficile, not specified as recurrent","{23294,23295,23333,23341,23343}",{},23343
23344,A04.8,ICD-10-CM,Other specified bacterial intestinal infections,"{23294,23295,23333,23344}",{},23344
23345,A04.9,ICD-10-CM,"Bacterial intestinal infection, unspecified","{23294,23295,23333,23345}",{},23345
"""  # nopep8


def _reset_session(session: MockSession, user: d.User):
    session.clear()

    collection = create_Collection(
        id=_c_id(1), item_ids=_cl_ids([1, 2, 3, 4, 5]), _owner_id=user.id
    )
    user.workspace.add_collection(collection.id)
    session.add(collection)

    for id_ in map(_cl_id, [1, 2, 3, 4, 5]):
        session.add(
            create_Codelist(id=id_, name=f"CL {id_}", container=collection.to_spec())
        )

    collection = create_Collection(
        id=_c_id(2), item_ids=_cl_ids([6, 7, 8, 9]), _owner_id=user.id
    )
    user.workspace.add_collection(collection.id)
    session.add(collection)

    for id_ in map(_cl_id, [6, 7, 8, 9]):
        session.add(
            create_Codelist(id=id_, name=f"CL {id_}", container=collection.to_spec())
        )

    collection = create_Collection(
        id=_c_id(10), item_ids=_cl_ids([10, 11, 12]), _owner_id=_u_id(2)
    )
    session.add(collection)
    for id_ in map(_cl_id, [10, 11, 12]):
        session.add(
            create_Codelist(id=id_, name=f"CL {id_}", container=collection.to_spec())
        )

    session.add(d.Ontology(id="ICD-10-CM", root_code_ids=[1]))
    reader = csv.DictReader(StringIO(code_data), strict=True)
    for row in reader:
        row["id"] = int(row["id"])
        row["last_descendant_id"] = int(row["last_descendant_id"])
        row["path"] = row["path"].strip("{}")
        row["path"] = [int(x) for x in row["path"].split(",") if x]
        row["children_ids"] = row["children_ids"].strip("{}")
        row["children_ids"] = [int(x) for x in row["children_ids"].split(",") if x]
        session.add(d.Code(**row))


class TestCreateCodelist:
    def test_add_root(self, session: Session, user: d.User):
        session = MockSession()
        _reset_session(session, user)

        ref_collection = session.get(d.Collection, _c_id(1))

        i8r = CreateCodelist(session, user)
        dto = gql.CreateCodelistRequestDto(
            position=gql.ReferencePosition(container_id=ref_collection.id),
            name="foo",
            description="bar",
            reference_id=_cl_id(42),
        )

        got = i8r(dto)

        assert got.name == "foo"
        assert got.description == "bar"
        assert got.reference_id == _cl_id(42)
        assert got.container == ref_collection.to_spec()

        assert ref_collection.item_ids[0] == got.id

    def test_no_access_to_collection(self, session: Session, user: d.User):
        session = MockSession()
        _reset_session(session, user)

        ref_collection: d.Collection = session.get(d.Collection, _c_id(10))

        i8r = CreateCodelist(session, user)
        dto = gql.CreateCodelistRequestDto(
            position=gql.ReferencePosition(container_id=ref_collection.id), name="Test"
        )

        with pytest.raises(ContainerNotExistsException) as excinfo:
            i8r(dto)
        assert f"ID {ref_collection.id}" in repr(excinfo.value)


class TestUpdateCodelist:
    def test_name_and_description(self, session: Session, user: d.User):
        session = MockSession()
        _reset_session(session, user)

        codelist: d.Codelist = session.get(d.Codelist, _cl_id(1))

        i8r = UpdateCodelist(session, user)
        dto = gql.UpdateCodelistRequestDto(
            codelist_id=codelist.id, name="Updated CL", description="Description"
        )

        got = i8r(dto)

        assert got.id == codelist.id
        assert got.name == "Updated CL"
        assert got.description == "Description"

    def test_name_only(self, session: Session, user: d.User):
        session = MockSession()
        _reset_session(session, user)

        codelist: d.Codelist = session.get(d.Codelist, _cl_id(1))

        i8r = UpdateCodelist(session, user)
        dto = gql.UpdateCodelistRequestDto(codelist_id=codelist.id, name="Test CL")

        got = i8r(dto)

        assert got.id == codelist.id
        assert got.name == "Test CL"
        assert got.description == ""

    def test_description_only(self, session: Session, user: d.User):
        session = MockSession()
        _reset_session(session, user)

        codelist: d.Codelist = session.get(d.Codelist, _cl_id(1))

        i8r = UpdateCodelist(session, user)
        dto = gql.UpdateCodelistRequestDto(
            codelist_id=codelist.id, description="Description"
        )

        got = i8r(dto)

        assert got.id == codelist.id
        assert got.description == "Description"
        assert got.name == f"CL {codelist.id}"

    def test_no_access_to_collection(self, session: Session, user: d.User):
        session = MockSession()
        _reset_session(session, user)

        codelist: d.Codelist = session.get(d.Codelist, _cl_id(10))

        i8r = UpdateCodelist(session, user)
        dto = gql.UpdateCodelistRequestDto(codelist_id=codelist.id)

        with pytest.raises(CodelistNotExistsException) as excinfo:
            i8r(dto)
        assert f"ID {codelist.id}" in repr(excinfo.value)


class TestDeleteCodelist:
    def test_execute_successful(self, session: Session, user: d.User):
        session = MockSession()
        _reset_session(session, user)

        codelist: d.Codelist = session.get(d.Codelist, _cl_id(1))
        collection: d.Collection = session.get(d.Collection, codelist.container.id)

        i8r = DeleteCodelist(session, user)
        dto = gql.DeleteCodelistRequestDto(codelist_id=codelist.id)

        assert i8r(dto) is True
        assert codelist.id not in collection

    def test_no_access_to_collection(self, session: Session, user: d.User):
        session = MockSession()
        _reset_session(session, user)

        codelist: d.Codelist = session.get(d.Codelist, _cl_id(10))

        i8r = DeleteCodelist(session, user)
        dto = gql.DeleteCodelistRequestDto(codelist_id=codelist.id)

        with pytest.raises(CodelistNotExistsException) as excinfo:
            i8r(dto)
        assert f"ID {codelist.id}" in repr(excinfo.value)


class TestCloneCodelist:
    def test_execute_successful(self, session: Session, user: d.User):
        session = MockSession()
        _reset_session(session, user)

        codelist: d.Codelist = session.get(d.Codelist, _cl_id(2))

        i8r = CloneCodelist(session, user)
        dto = gql.CloneCodelistRequestDto(codelist_id=_cl_id(2))

        got = i8r(dto)

        assert got.id != codelist.id
        assert got.name == codelist.name + " (copy)"
        assert got.reference_id == codelist.id
        assert got.description == codelist.description
        assert got.container == codelist.container

    def test_no_access_to_collection(self, session: Session, user: d.User):
        session = MockSession()
        _reset_session(session, user)

        codelist: d.Codelist = session.get(d.Codelist, _cl_id(10))

        i8r = CloneCodelist(session, user)
        dto = gql.CloneCodelistRequestDto(codelist_id=codelist.id)

        with pytest.raises(CodelistNotExistsException) as excinfo:
            i8r(dto)
        assert f"ID {codelist.id}" in repr(excinfo.value)


class TestImportCodelists:
    def test_import_successful(self, session: Session, user: d.User):
        session = MockSession()
        _reset_session(session, user)

        collection: d.Collection = session.get(d.Collection, _c_id(1))

        i8r = ImportCodelists(session, user)
        dto = gql.ImportCodelistsRequestDto(
            container_id=collection.id,
            codelists=[
                gql.CodelistInput(
                    name="foo",
                    codesets=[
                        gql.CodesetInput(ontology_id="ICD-10-CM", codes=["A01.05"])
                    ],
                )
            ],
            filename="Test.xlsx",
        )

        got = i8r(dto)

        assert got.stats == gql.ImportStats(fully=1)
        assert len(got.reports) == 1
        assert got.reports[0].codelist_name == "foo"
        assert collection.item_ids[-1] == got.reports[0].codelist_id

    def test_invalid_ontology_raises_error(self, session: Session, user: d.User):
        session = MockSession()
        _reset_session(session, user)

        collection: d.Collection = session.get(d.Collection, _c_id(1))

        i8r = ImportCodelists(session, user)
        dto = gql.ImportCodelistsRequestDto(
            container_id=collection.id,
            codelists=[
                gql.CodelistInput(
                    name="test",
                    codesets=[gql.CodesetInput(ontology_id="IPCC", codes=["BURNING"])],
                )
            ],
            filename="Test.xlsx",
        )

        with pytest.raises(ValueError):
            i8r(dto)

    def test_repeated_ontology_raises_error(self, session: Session, user: d.User):
        session = MockSession()
        _reset_session(session, user)

        collection: d.Collection = session.get(d.Collection, _c_id(1))

        i8r = ImportCodelists(session, user)
        dto = gql.ImportCodelistsRequestDto(
            container_id=collection.id,
            codelists=[
                gql.CodelistInput(
                    name="test",
                    codesets=[
                        gql.CodesetInput(ontology_id="ICD-10-CM", codes=["A01.05"]),
                        gql.CodesetInput(ontology_id="ICD-10-CM", codes=["A01.09"]),
                    ],
                )
            ],
            filename="Test.xlsx",
        )

        with pytest.raises(ValueError):
            i8r(dto)


class TestMoveCodelist:
    def test_move_codelist(self, session: Session, user: d.User):
        session = MockSession()
        _reset_session(session, user)

        # `want` is a dictionary of the collection id and the expected codelist ids,
        #   also defining the expected order of the codelists.
        test_cases = [
            # test case 1: move codelist to the beginning of the same container
            {
                "param": gql.MoveCodelistRequestDto(
                    codelist_id=_cl_id(3),
                    position=gql.ReferencePosition(
                        container_id=_c_id(1),
                        item_id=None,
                    ),
                ),
                "want": {
                    _c_id(1): _cl_ids([3, 1, 2, 4, 5]),
                    _c_id(2): _cl_ids([6, 7, 8, 9]),
                },
            },
            # test case 2: move codelist to the end of the same container
            {
                "param": gql.MoveCodelistRequestDto(
                    codelist_id=_cl_id(3),
                    position=gql.ReferencePosition(
                        container_id=_c_id(1),
                        item_id=_cl_id(5),
                    ),
                ),
                "want": {
                    _c_id(1): _cl_ids([1, 2, 4, 5, 3]),
                    _c_id(2): _cl_ids([6, 7, 8, 9]),
                },
            },
            # test case 3: move codelist to the beginning of another container
            {
                "param": gql.MoveCodelistRequestDto(
                    codelist_id=_cl_id(3),
                    position=gql.ReferencePosition(
                        container_id=_c_id(2),
                        item_id=None,
                    ),
                ),
                "want": {
                    _c_id(1): _cl_ids([1, 2, 4, 5]),
                    _c_id(2): _cl_ids([3, 6, 7, 8, 9]),
                },
            },
            # test case 4: move codelist to the end of another container
            {
                "param": gql.MoveCodelistRequestDto(
                    codelist_id=_cl_id(3),
                    position=gql.ReferencePosition(
                        container_id=_c_id(2),
                        item_id=_cl_id(9),
                    ),
                ),
                "want": {
                    _c_id(1): _cl_ids([1, 2, 4, 5]),
                    _c_id(2): _cl_ids([6, 7, 8, 9, 3]),
                },
            },
        ]

        for test in test_cases:
            _reset_session(session, user)
            i8r = MoveCodelist(session, user)
            assert i8r(test["param"]) is True

            for collection_id, want_item_ids in test["want"].items():
                collection = session.get(d.Collection, collection_id)
                assertListEqual(collection.item_ids, want_item_ids)
