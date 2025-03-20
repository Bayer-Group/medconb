import json
from typing import TYPE_CHECKING
from unittest import TestCase

if TYPE_CHECKING:
    from starlette.testclient import TestClient


def assertDictEqual(d1, d2, msg=None):
    tc = TestCase()
    tc.maxDiff = None
    return tc.assertDictEqual(d1, d2, msg)


def assertListEqual(l1, l2, msg=None):
    tc = TestCase()
    tc.maxDiff = None
    return tc.assertListEqual(l1, l2, msg)


def graphql_request(client, body):
    return client.post(
        url="/graphql/", headers={"Authorization": "Bearer FOOBAR"}, json=body
    )


def test_createCollection(client: "TestClient"):
    response = graphql_request(
        client,
        {
            "query": """mutation {
                createCollection(
                    name: "Test 1"
                    itemType: Codelist
                    description: "Test D"
                    properties: [
                        {
                            propertyID: 21
                            name: "Country"
                            value: "Germany"
                        },
                        {
                            propertyID: null
                            name: "foo"
                            value: "bar"
                        }
                    ]
                    referenceID: "00000000-0000-0000-0002-000000000005"
                ) {
                    id
                    name
                    description
                    referenceID
                    itemType
                    items {
                        __typename
                        ... on Codelist {
                            id
                        }
                    }
                    sharedWith
                    properties {propertyID name value}
                }
            }"""
        },
    )

    resp_data = json.loads(response.text)["data"]
    exec_data = resp_data["createCollection"]

    response = graphql_request(
        client,
        {
            "query": """query {
                collection(id: """
            + f'"{exec_data["id"]}"'
            + """) {
                    id
                    name
                    description
                    referenceID
                    itemType
                    items {
                        __typename
                        ... on Codelist {
                            id
                        }
                    }
                    sharedWith
                    properties {propertyID name value}
                }
            }"""
        },
    )

    resp_data = json.loads(response.text)["data"]
    query_data = resp_data["collection"]

    assertDictEqual(query_data, exec_data)
    assert query_data["name"] == "Test 1"
    assert query_data["itemType"] == "Codelist"
    assert query_data["description"] == "Test D"
    assert query_data["referenceID"] == "00000000-0000-0000-0002-000000000005"
    assert query_data["sharedWith"] == []
    assert query_data["items"] == []
    for want in [
        {"propertyID": None, "name": "foo", "value": "bar"},
        {"propertyID": 21, "name": "Country", "value": "Germany"},
    ]:
        assert want in query_data["properties"]


def test_deleteCollection(client: "TestClient"):
    response = graphql_request(
        client,
        {
            "query": "mutation { "
            'deleteCollection(collectionID: "00000000-0000-0000-0002-000000000002") }'
        },
    )

    resp_data = json.loads(response.text)["data"]["deleteCollection"]
    assert resp_data is True

    response = graphql_request(
        client,
        {
            "query": """query {
                self {
                    id
                    workspace {
                        collections {
                            id
                            name
                        }
                    }
                }
            }"""
        },
    )

    resp_data = json.loads(response.text)["data"]
    d = resp_data["self"]["workspace"]["collections"]

    assert len([c for c in d if c["id"] == "00000000-0000-0000-0002-000000000002"]) == 0


def test_updateCollection(client: "TestClient"):
    response = graphql_request(
        client,
        {
            "query": """mutation {
                updateCollection(
                    collectionID: "00000000-0000-0000-0002-000000000002"
                    name: "Study 42"
                    description: "Barfoo"
                    referenceID: "00000000-0000-0000-0002-000000000005"
                    properties: [
                        {
                            propertyID: 21
                            name: "Country"
                            value: "Germany"
                        },
                        {
                            name: "foo"
                            value: "bar"
                        }
                    ]
                ) { id name description }
            }"""
        },
    )

    resp_data = json.loads(response.text)["data"]["updateCollection"]
    assert resp_data == {
        "id": "00000000-0000-0000-0002-000000000002",
        "name": "Study 42",
        "description": "Barfoo",
    }

    response = graphql_request(
        client,
        {
            "query": """query {
                collection(id: "00000000-0000-0000-0002-000000000002") {
                    id
                    name
                    description
                    referenceID
                    properties {propertyID name value}
                }
            }"""
        },
    )

    updated_collection = json.loads(response.text)["data"]["collection"]

    assert updated_collection["name"] == "Study 42"
    assert updated_collection["description"] == "Barfoo"
    assert updated_collection["referenceID"] == "00000000-0000-0000-0002-000000000005"
    for want in [
        {"name": "foo", "propertyID": None, "value": "bar"},
        {"propertyID": 21, "name": "Country", "value": "Germany"},
    ]:
        assert want in updated_collection["properties"]


def test_moveCollection(client: "TestClient"):
    response = graphql_request(
        client,
        {
            "query": """mutation {
                moveCollection(
                    collectionID: "00000000-0000-0000-0002-000000000001"
                    refCollectionID: null
                )
            }"""
        },
    )
    assertDictEqual(
        json.loads(response.text),
        json.loads('{"data":{"moveCollection": true}}'),
    )

    response = graphql_request(
        client,
        {
            "query": """query {
                self {
                    id
                    workspace {
                        collections {
                            id
                            name
                        }
                    }
                }
            }"""
        },
    )

    resp_data = json.loads(response.text)["data"]
    d = resp_data["self"]["workspace"]["collections"]
    assert d[0]["id"] == "00000000-0000-0000-0002-000000000001"


def test_setCollectionPermissions(client: "TestClient"):
    response = graphql_request(
        client,
        {
            "query": """mutation {
                setCollectionPermissions(
                    collectionID: "00000000-0000-0000-0002-000000000002"
                    readerIds: ["00000000-0000-0000-0001-000000000001"]
                )
            }"""
        },
    )
    assertDictEqual(
        json.loads(response.text),
        json.loads('{"data":{"setCollectionPermissions": true}}'),
    )


def test_createPhenotype(client: "TestClient"):
    response = graphql_request(
        client,
        {
            "query": """mutation {
                createPhenotype(
                    position: { containerID: "00000000-0000-0000-0002-000000000007" }
                    name: "Test 1"
                    medicalDescription: "Test MD"
                    operationalDescription: "Test OD"
                    properties: [
                        {
                            propertyID: 1
                            name: "Used for"
                            value: "inclusion"
                        },
                        {
                            name: "foo"
                            value: "bar"
                        }
                    ]
                    referenceID: "00000000-0000-0000-0005-000000000001"
                ) {
                    id
                    name
                    medicalDescription
                    operationalDescription
                    referenceID
                    codelists { id }
                    properties { propertyID name value }
                }
            }"""
        },
    )

    resp_data = json.loads(response.text)["data"]
    exec_data = resp_data["createPhenotype"]

    response = graphql_request(
        client,
        {
            "query": """query {
                phenotype(phenotypeID: """
            + f'"{exec_data["id"]}"'
            + """) {
                    id
                    name
                    medicalDescription
                    operationalDescription
                    referenceID
                    codelists { id }
                    properties { propertyID name value }
                }
            }"""
        },
    )

    resp_data = json.loads(response.text)["data"]
    query_data = resp_data["phenotype"]

    assertDictEqual(query_data, exec_data)
    assert query_data["name"] == "Test 1"
    assert query_data["medicalDescription"] == "Test MD"
    assert query_data["operationalDescription"] == "Test OD"
    assert query_data["referenceID"] == "00000000-0000-0000-0005-000000000001"
    for want in [
        {"propertyID": None, "name": "foo", "value": "bar"},
        {"propertyID": 1, "name": "Used for", "value": "inclusion"},
    ]:
        assert want in query_data["properties"]


def test_deletePhenotype(client: "TestClient"):
    response = graphql_request(
        client,
        {
            "query": """mutation { deletePhenotype(
                phenotypeID: "00000000-0000-0000-0005-000000000001"
            ) }"""
        },
    )

    resp_data = json.loads(response.text)["data"]["deletePhenotype"]
    assert resp_data is True

    response = graphql_request(
        client,
        {
            "query": """query {
                phenotype(
                    phenotypeID: "00000000-0000-0000-0005-000000000001"
                ) { id }
            }"""
        },
    )

    resp_data = json.loads(response.text)
    assert resp_data["data"] is None
    assert resp_data["errors"] is not None


def test_updatePhenotype(client: "TestClient"):
    response = graphql_request(
        client,
        {
            "query": """mutation {
                updatePhenotype(
                    phenotypeID: "00000000-0000-0000-0005-000000000001"
                    position: {
                        containerID: "00000000-0000-0000-0002-000000000008"
                    }
                    name: "Study 42"
                    medicalDescription: "Barfoo"
                    operationalDescription: "Foobar"
                    referenceID: "00000000-0000-0000-0005-000000000001"
                    properties: [
                        {
                            propertyID: 1
                            name: "Used for"
                            value: "inclusion"
                        },
                        {
                            name: "foo"
                            value: "bar"
                        }
                    ]
                ) { id name medicalDescription }
            }"""
        },
    )

    resp_data = json.loads(response.text)["data"]["updatePhenotype"]
    assert resp_data == {
        "id": "00000000-0000-0000-0005-000000000001",
        "name": "Study 42",
        "medicalDescription": "Barfoo",
    }

    response = graphql_request(
        client,
        {
            "query": """query {
                phenotype(phenotypeID: "00000000-0000-0000-0005-000000000001") {
                    id
                    name
                    medicalDescription
                    operationalDescription
                    referenceID
                    codelists { id }
                    properties { propertyID name value }
                },
                collection(id: "00000000-0000-0000-0002-000000000008") {
                    items {
                        __typename
                        ... on Phenotype {
                            id
                        }
                    }
                }
            }"""
        },
    )

    resp_data = json.loads(response.text)["data"]
    phenotype_data = resp_data["phenotype"]
    collection_data = resp_data["collection"]

    assert phenotype_data["name"] == "Study 42"
    assert phenotype_data["medicalDescription"] == "Barfoo"
    assert phenotype_data["operationalDescription"] == "Foobar"
    assert phenotype_data["referenceID"] == "00000000-0000-0000-0005-000000000001"
    for want in [
        {"propertyID": None, "name": "foo", "value": "bar"},
        {"propertyID": 1, "name": "Used for", "value": "inclusion"},
    ]:
        assert want in phenotype_data["properties"]

    assert collection_data["items"][0]["id"] == phenotype_data["id"]


def test_createCodelist(client: "TestClient"):
    response = graphql_request(
        client,
        {
            "query": """mutation {
                createCodelist(
                    position: { containerID: "00000000-0000-0000-0002-000000000002" }
                    name: "Test CL 42"
                    description: "Test D"
                    referenceID: "00000000-0000-0000-0004-000000000005"
                ) { id }
            }"""
        },
    )

    resp_data = json.loads(response.text)["data"]
    exec_data = resp_data["createCodelist"]
    new_id = exec_data["id"]

    response = graphql_request(
        client,
        {
            "query": """query {
                codelist(
                    codelistID: """
            f'"{new_id}"'
            """
                ) {
                    id
                    name
                    description
                    referenceID
                }
            }"""
        },
    )

    resp_data = json.loads(response.text)["data"]["codelist"]
    assert resp_data["name"] == "Test CL 42"
    assert resp_data["description"] == "Test D"
    assert resp_data["referenceID"] == "00000000-0000-0000-0004-000000000005"


def test_deleteCodelist(client: "TestClient"):
    response = graphql_request(
        client,
        {
            "query": """mutation {
                deleteCodelist(
                    codelistID: "00000000-0000-0000-0004-000000000004"
                )
            }"""
        },
    )

    resp_data = json.loads(response.text)["data"]["deleteCodelist"]
    assert resp_data is True

    response = graphql_request(
        client,
        {
            "query": """query {
                codelist(
                    codelistID: "00000000-0000-0000-0004-000000000004"
                ) {
                    id
                }
            }"""
        },
    )

    assert json.loads(response.text)["data"] is None
    assert json.loads(response.text)["errors"] is not None


def test_updateCodelist(client: "TestClient"):
    response = graphql_request(
        client,
        {
            "query": """mutation {
                updateCodelist(
                    codelistID: "00000000-0000-0000-0004-000000000004"
                    name: "CL 42"
                    description: "dCC 42"
                    referenceID: "00000000-0000-0000-0004-000000000005"
                ) { id name description }
            }"""
        },
    )

    resp_data = json.loads(response.text)["data"]["updateCodelist"]
    assert resp_data == {
        "id": "00000000-0000-0000-0004-000000000004",
        "name": "CL 42",
        "description": "dCC 42",
    }

    response = graphql_request(
        client,
        {
            "query": """query {
                codelist(
                    codelistID: "00000000-0000-0000-0004-000000000004"
                ) {
                    id
                    name
                    description
                    referenceID
                }
            }"""
        },
    )

    resp_data = json.loads(response.text)["data"]
    updated_cl = resp_data["codelist"]

    assert updated_cl["name"] == "CL 42"
    assert updated_cl["description"] == "dCC 42"
    assert updated_cl["referenceID"] == "00000000-0000-0000-0004-000000000005"


def test_cloneCodelist(client: "TestClient"):
    response = graphql_request(
        client,
        {
            "query": """mutation {
                cloneCodelist(
                    codelistID: "00000000-0000-0000-0004-000000000004"
                ) { id }
            }"""
        },
    )

    resp_data = json.loads(response.text)["data"]
    exec_data = resp_data["cloneCodelist"]
    new_id = exec_data["id"]

    response = graphql_request(
        client,
        {
            "query": """query {
                original: codelist(
                    codelistID: "00000000-0000-0000-0004-000000000004"
                ) {
                    id
                    name
                    description
                    referenceID
                }
                clone: codelist("""
            f'codelistID: "{new_id}"'
            """
                ) {
                    id
                    name
                    description
                    referenceID
                }
            }"""
        },
    )

    resp_data = json.loads(response.text)["data"]
    original_cl = resp_data["original"]
    cloned_cl = resp_data["clone"]

    assert cloned_cl["name"].startswith(original_cl["name"])
    assert cloned_cl["description"] == original_cl["description"]
    assert cloned_cl["referenceID"] == original_cl["id"]


def test_importCodelist(client: "TestClient"):
    response = graphql_request(
        client,
        {
            "query": """mutation {
                importCodelists(
                    containerID: "00000000-0000-0000-0002-000000000002"
                    codelists: [
                        {
                            name: "Import_Test"
                            codesets: [
                                {
                                    ontologyID: "ICD-10-CM"
                                    codes: ["J01.90", "J01.80", "J01.92"]
                                },
                                {
                                    ontologyID: "ICD-9-CM"
                                    codes: ["J01.90", "J01.80", "J01.92"]
                                },
                            ]
                        }
                    ]
                    filename: "Test_File.xlsx"
                ) {
                    stats {
                        fully partially skipped
                    }
                    reports {
                        codelistID
                        codelistName
                        skipped
                        partial
                        report
                    }
                }
            }"""
        },
    )

    resp_data = json.loads(response.text)["data"]
    exec_data = resp_data["importCodelists"]

    assertDictEqual(exec_data["stats"], {"fully": 0, "partially": 1, "skipped": 0})
    assert len(exec_data["reports"]) == 1
    report = exec_data["reports"][0]
    assert report["codelistName"] == "Import_Test"
    assert not report["skipped"]
    assert report["partial"]
    assert report["report"] == (
        "Imported 'Import_Test' from file 'Test_File.xlsx' with 2 codes from 1 "
        "ontologies (ICD-10-CM: 2/3). The following ontologies were skipped because "
        "they didn't have any valid codes: ICD-9-CM\n\n"
        "The following codes were not imported:\nICD-10-CM: J01.92"
    )
    new_id = report["codelistID"]

    response = graphql_request(
        client,
        {
            "query": "query {codelist("
            f'codelistID: "{new_id}"'
            """
                ) {
                    name
                    description
                    codesets {
                        ontology { name }
                        codes { id }
                    }
                }
            }"""
        },
    )

    cl = json.loads(response.text)["data"]["codelist"]
    assertListEqual(
        cl["codesets"],
        json.loads(
            '[{"ontology":{"name":"ICD-10-CM"},"codes":[{"id":"36248"},{"id":"36251"}]}]'  # noqa
        ),
    )
    assert cl["name"] == "Import_Test"
    assert (
        "Imported 'Import_Test' from file 'Test_File.xlsx' with 2 codes"
        in cl["description"]
    )
    assert "didn't have any valid codes: ICD-9-CM" in cl["description"]


def test_moveCodelist(client: "TestClient"):
    response = graphql_request(
        client,
        {
            "query": """mutation {
                moveCodelist(
                    codelistID: "00000000-0000-0000-0004-000000000002"
                    position: {
                        containerID: "00000000-0000-0000-0002-000000000002"
                        itemID: "00000000-0000-0000-0004-000000000004"
                    }
                )
            }"""
        },
    )
    assertDictEqual(
        json.loads(response.text),
        json.loads('{"data":{"moveCodelist":true}}'),
    )

    response = graphql_request(
        client,
        {
            "query": """query {
                self {
                    id
                    workspace {
                        collections {
                            id
                            items {
                                __typename
                                ... on Codelist { id }
                            }
                        }
                    }
                }
            }"""
        },
    )

    resp_data = json.loads(response.text)["data"]
    d = resp_data["self"]["workspace"]["collections"]
    collection = [c for c in d if c["id"] == "00000000-0000-0000-0002-000000000001"][0]

    assert (
        len(
            [
                cl
                for cl in collection["items"]
                if cl["id"] == "00000000-0000-0000-0004-000000000002"
            ]
        )
        == 0
    )

    collection = [c for c in d if c["id"] == "00000000-0000-0000-0002-000000000002"][0]

    assert (
        len(
            [
                cl
                for cl in collection["items"]
                if cl["id"] == "00000000-0000-0000-0004-000000000002"
            ]
        )
        == 1
    )


def test_commitChanges(client: "TestClient"):
    response = graphql_request(
        client,
        {
            "query": """mutation {
                commitChanges(
                    codelistID: "00000000-0000-0000-0004-000000000004"
                    commit: {
                        message: "foo"
                        changes: [
                            {
                                ontologyID: "ICD-10-CM"
                                added: [34657]
                                removed: [34631]
                            }
                        ]
                    }
                ) { id }
            }"""
        },
    )
    assertDictEqual(
        json.loads(response.text),
        json.loads(
            '{"data":{"commitChanges":{"id":"00000000-0000-0000-0004-000000000004"}}}'
        ),
    )


def test_storeTransientChanges(client: "TestClient"):
    response = graphql_request(
        client,
        {
            "query": """mutation {
                storeTransientChanges(
                    codelistID: "00000000-0000-0000-0004-000000000004"
                    changes: [
                        {
                            ontologyID: "ICD-10-CM"
                                added: [34657]
                                removed: [34631]
                        }
                    ]
                ) { id }
            }"""
        },
    )
    assertDictEqual(
        json.loads(response.text),
        json.loads(
            '{"data":{"storeTransientChanges":{"id":"00000000-0000-0000-0004-000000000004"}}}'  # noqa
        ),
    )


def test_discardTransientChanges(client: "TestClient"):
    response = graphql_request(
        client,
        {
            "query": """mutation {
                discardTransientChanges(
                    codelistID: "00000000-0000-0000-0004-000000000004"
                ) { id }
            }"""
        },
    )
    assertDictEqual(
        json.loads(response.text),
        json.loads(
            '{"data":{"discardTransientChanges":{"id":"00000000-0000-0000-0004-000000000004"}}}'  # noqa
        ),
    )
