import json
from typing import TYPE_CHECKING
from unittest import TestCase

if TYPE_CHECKING:
    from starlette.testclient import TestClient


def assertDictEqual(d1, d2, msg=None):
    tc = TestCase()
    tc.maxDiff = None
    return tc.assertDictEqual(d1, d2, msg)


def test_self(client: "TestClient"):
    response = client.post(
        url="/graphql/",
        headers={"Authorization": "Bearer FOOBAR"},
        json={
            "query": """query {
                self {
                    id
                    workspace {
                        collections {
                            id
                            name
                            itemType
                            items {
                                __typename
                                ... on Codelist {
                                    id
                                    name
                                    referenceID
                                }
                                ... on Phenotype {
                                    id name
                                    codelists {
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
            }"""
        },
    )

    res = json.loads(response.text)["data"]["self"]
    collections = res["workspace"]["collections"]
    assert res is not None

    a_codelist_collection = [
        c for c in collections if c["id"] == "00000000-0000-0000-0002-000000000001"
    ][0]
    assert len(a_codelist_collection["items"]) > 0

    a_phenotype_collection = [
        c for c in collections if c["id"] == "00000000-0000-0000-0002-000000000007"
    ][0]
    assert len(a_phenotype_collection["items"]) > 0


def test_ontologies(client: "TestClient"):
    response = client.post(
        url="/graphql/",
        headers={"Authorization": "Bearer FOOBAR"},
        json={"query": "query { ontologies { name } }"},
    )
    res = json.loads(response.text)
    assert "data" in res
    assert "ontologies" in res["data"]
    assert "ICD-10-CM" in [o["name"] for o in res["data"]["ontologies"]]


def test_ontology(client: "TestClient"):
    response = client.post(
        url="/graphql/",
        headers={"Authorization": "Bearer FOOBAR"},
        json={
            "query": """query {
                ontology(name: "ICD-10-CM") {
                    name
                    rootCodes(pageSize: 100) {
                        id
                    }
                }
            }"""
        },
    )
    res = json.loads(response.text)
    assert "data" in res
    assert "ontology" in res["data"]
    assert "name" in res["data"]["ontology"]
    assert res["data"]["ontology"]["name"] == "ICD-10-CM"
    assert len(res["data"]["ontology"]["rootCodes"]) == 22


def test_code(client: "TestClient"):
    response = client.post(
        url="/graphql/",
        headers={"Authorization": "Bearer FOOBAR"},
        json={
            "query": """query {
                code(id: 23345) {
                    id
                    code
                    description
                    parent { id code }
                    path { id }
                    children { id }
                    numberOfChildren
                    lastDescendantId
                }
            }"""
        },
    )
    assertDictEqual(
        json.loads(response.text),
        json.loads(
            '{"data":{"code":{"id":"23345","code":"A04.9","description":"Bacterial intestinal infection, unspecified","parent":{"id":"23333","code":"A04"},"path":[{"id":"23294"},{"id":"23295"},{"id":"23333"},{"id":"23345"}],"children":[],"numberOfChildren":0,"lastDescendantId":23345}}}'  # noqa
        ),
    )


def test_codes(client: "TestClient"):
    response = client.post(
        url="/graphql/",
        headers={"Authorization": "Bearer FOOBAR"},
        json={
            "query": """query {
                codes(ids: [-1, 23341, 23344, 23345]) {
                    id
                    code
                }
            }"""
        },
    )

    expected_codes = {("23341", "A04.7"), ("23344", "A04.8"), ("23345", "A04.9")}

    res = json.loads(response.text)["data"]["codes"]
    assert {(c["id"], c["code"]) for c in res} == expected_codes


def test_search_codes(client: "TestClient"):
    response = client.post(
        url="/graphql/",
        headers={"Authorization": "Bearer FOOBAR"},
        json={
            "query": """query {
                searchCodes(
                    ontologyID: "ICD-10-CM",
                    query:{code: {value: "Z.*", type: POSIX}, description:"alcohol abu"}
                ) { id }
            }"""
        },
    )

    expected_ids = {"118404", "118405", "118563"}

    res = json.loads(response.text)["data"]["searchCodes"]
    assert {c["id"] for c in res} == expected_ids


def test_collection(client: "TestClient"):
    response = client.post(
        url="/graphql/",
        headers={"Authorization": "Bearer FOOBAR"},
        json={
            "query": """query {
                collection(id: "00000000-0000-0000-0002-000000000004") {
                    id
                    name
                    description
                    referenceID
                    itemType
                    items {
                        __typename
                        ... on Codelist {
                            id
                            name
                            referenceID
                        }
                        ... on Phenotype {
                            id name
                            codelists {
                                id
                            }
                        }
                    }
                    properties {
                        propertyID
                        name
                        value
                    }
                    sharedWith
                }
            }"""
        },
    )

    res = json.loads(response.text)["data"]["collection"]

    assertDictEqual(
        res,
        {
            "id": "00000000-0000-0000-0002-000000000004",
            "name": "Flieder [Sample]",
            "itemType": "Codelist",
            "description": "Descr 4",
            "sharedWith": ["00000000-0000-0000-0001-000000000001"],
            "referenceID": None,
            "properties": [],
            "items": [
                {
                    "__typename": "Codelist",
                    "id": "00000000-0000-0000-0004-000000000007",
                    "name": "Angina",
                    "referenceID": None,
                },
                {
                    "__typename": "Codelist",
                    "id": "00000000-0000-0000-0004-000000000006",
                    "name": "Atherosclerosis",
                    "referenceID": None,
                },
                {
                    "__typename": "Codelist",
                    "id": "00000000-0000-0000-0004-000000000005",
                    "name": "Coronary Artery Disease",
                    "referenceID": None,
                },
            ],
        },
    )


def test_phenotype(client: "TestClient"):
    response = client.post(
        url="/graphql/",
        headers={"Authorization": "Bearer FOOBAR"},
        json={
            "query": """query {
                phenotype(
                    phenotypeID: "00000000-0000-0000-0005-000000000001"
                ) {
                    id
                    name
                    medicalDescription
                    operationalDescription
                    referenceID
                    codelists { id }
                    properties {
                        propertyID
                        name
                        value
                    }
                    containerHierarchy {
                        id
                        name
                        type
                        visibility
                    }
                }
            }"""
        },
    )

    res = json.loads(response.text)["data"]["phenotype"]
    assert res["id"] == "00000000-0000-0000-0005-000000000001"
    assert res["name"] == "CKD"
    assert res["referenceID"] is None
    assert res["codelists"] == [{"id": "00000000-0000-0000-0004-000000000009"}]
    assert res["properties"] == [
        {"propertyID": 1, "name": "Used for", "value": "inclusion"}
    ]
    assert res["containerHierarchy"] == [
        {
            "id": "00000000-0000-0000-0002-000000000007",
            "name": "Phenotype Collection",
            "type": "Collection",
            "visibility": "Private",
        }
    ]
    assert "CKD description" in res["medicalDescription"]
    assert "CKD op description" in res["operationalDescription"]


def test_properties(client: "TestClient"):
    response = client.post(
        url="/graphql/",
        headers={"Authorization": "Bearer FOOBAR"},
        json={
            "query": """query {
                properties {
                    id
                    name
                    class
                    dtype
                    required
                    options
                }
            }"""
        },
    )

    res = json.loads(response.text)["data"]["properties"]
    assert len(res) > 0

    for prop in res:
        if prop["dtype"] == "Enum":
            assert prop["options"] and len(prop["options"]) > 0


def test_phenotype_properties(client: "TestClient"):
    response = client.post(
        url="/graphql/",
        headers={"Authorization": "Bearer FOOBAR"},
        json={
            "query": """query {
                properties(clazz: Phenotype) {
                    id
                    name
                    class
                    dtype
                    required
                    options
                }
            }"""
        },
    )

    res = json.loads(response.text)["data"]["properties"]
    assert len(res) > 0


def test_codelist(client: "TestClient"):
    response = client.post(
        url="/graphql/",
        headers={"Authorization": "Bearer FOOBAR"},
        json={
            "query": """query {
                codelist(
                    codelistID: "00000000-0000-0000-0004-000000000002"
                ) {
                    id
                    name
                    description
                    referenceID
                    containerHierarchy {
                        id
                        name
                        type
                    }
                }
            }"""
        },
    )

    res = json.loads(response.text)["data"]["codelist"]
    assert res["id"] == "00000000-0000-0000-0004-000000000002"
    assert res["name"] == "Atherosclerosis"
    assert res["containerHierarchy"] == [
        {
            "id": "00000000-0000-0000-0002-000000000001",
            "name": "Flieder [Sample]",
            "type": "Collection",
        }
    ]
    assert "Imported 'Atherosclerosis' from" in res["description"]


def test_users(client: "TestClient"):
    response = client.post(
        url="/graphql/",
        headers={"Authorization": "Bearer FOOBAR"},
        json={
            "query": """query {
                users {
                    id
                    name
                    externalId
                }
            }"""
        },
    )

    res = json.loads(response.text)["data"]["users"]
    assert {(u["id"], u["name"]) for u in res} == {
        ("00000000-0000-0000-0001-000000000001", "Developer"),
        ("00000000-0000-0000-0001-000000000002", "Developer 2"),
    }
