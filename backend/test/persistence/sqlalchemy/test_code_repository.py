import json
from collections import namedtuple

from medconb import domain as d
from medconb.graphql.types import CodeSearchParam
from medconb.types import Session

# not using gql type to get around validation and use invalid values
QueryData = namedtuple("QueryData", "code description")


class TestSearchCodes:
    def test_empty_filters(self, session: Session):
        tests = [
            {
                "params": {
                    "query_data": QueryData(code=None, description=None),
                    "ontology_id": "ICD-10-CM",
                },
                "want": [],
            },
            {
                "params": {
                    "query_data": QueryData(
                        code=CodeSearchParam(value=""), description=""
                    ),
                    "ontology_id": "ICD-10-CM",
                },
                "want": [],
            },
        ]

        for test in tests:
            got = session.code_repository.search_codes(**test["params"])
            assert got == test["want"]

    def test_description_filter(self, session: Session):
        tests = [
            {
                "params": {
                    "query_data": QueryData(code=None, description="alcohol abuse"),
                    "ontology_id": "ICD-10-CM",
                },
                "want": json.loads(
                    "[28356,28357,28358,28359,28360,28361,28362,28363,28364,28365,28366,28367,28368,28369,28370,28371,28372,28373,28374,28375,28376,28377,28378,118404,118405,118563]"  # noqa
                ),
            },
            {
                "params": {
                    "query_data": QueryData(code=None, description="Alcohol abuse"),
                    "ontology_id": "ICD-10-CM",
                },
                "want": json.loads(
                    "[28356,28357,28358,28359,28360,28361,28362,28363,28364,28365,28366,28367,28368,28369,28370,28371,28372,28373,28374,28375,28376,28377,28378,118404,118405,118563]"  # noqa
                ),
            },
            {
                "params": {
                    "query_data": QueryData(code=None, description="Alcohol abuse%"),
                    "ontology_id": "ICD-10-CM",
                },
                "want": json.loads(
                    "[28356,28357,28358,28359,28360,28361,28362,28363,28364,28365,28366,28367,28368,28369,28370,28371,28372,28373,28374,28375,28376,28377,28378,118404,118405]"  # noqa
                ),
            },
        ]

        for test in tests:
            got = session.code_repository.search_codes(**test["params"])
            assert [c.id for c in got] == test["want"]

    def test_code_filter(self, session: Session):
        tests = [
            {
                "params": {
                    "query_data": QueryData(
                        code=CodeSearchParam(
                            value="V1.\\.4$", type=d.CodeSearchParamType.POSIX
                        ),
                        description=None,
                    ),
                    "ontology_id": "ICD-10-CM",
                },
                "want": json.loads(
                    "[108203, 108232, 108261, 108290, 108319, 108348, 108377, 108406, 108435, 108479]"  # noqa
                ),
            },
            {
                "params": {
                    "query_data": QueryData(
                        code=CodeSearchParam(
                            value="^C.*A$", type=d.CodeSearchParamType.POSIX
                        ),
                        description=None,
                    ),
                    "ontology_id": "ICD-10-CM",
                },
                "want": json.loads(
                    "[25038, 25127, 25500, 25501, 25853, 25865, 25993, 26034, 26109]"  # noqa
                ),
            },
            {
                "params": {
                    "query_data": QueryData(
                        code=CodeSearchParam(
                            value="v1_\\.4", type=d.CodeSearchParamType.ILIKE
                        ),
                        description=None,
                    ),
                    "ontology_id": "ICD-10-CM",
                },
                "want": json.loads(
                    "[108203, 108232, 108261, 108290, 108319, 108348, 108377, 108406, 108435, 108479]"  # noqa
                ),
            },
            {
                "params": {
                    "query_data": QueryData(
                        code=CodeSearchParam(
                            value="C%A", type=d.CodeSearchParamType.ILIKE
                        ),
                        description=None,
                    ),
                    "ontology_id": "ICD-10-CM",
                },
                "want": json.loads(
                    "[25038, 25127, 25500, 25501, 25853, 25865, 25993, 26034, 26109]"  # noqa
                ),
            },
        ]

        for test in tests:
            got = session.code_repository.search_codes(**test["params"])
            assert [c.id for c in got] == test["want"]

    def test_all_filter(self, session: Session):
        tests = [
            {
                "params": {
                    "query_data": QueryData(
                        code=CodeSearchParam(
                            value="^[^FGK].{1,2}$", type=d.CodeSearchParamType.POSIX
                        ),
                        description="alcohol",
                    ),
                    "ontology_id": "ICD-10-CM",
                },
                "want": [102004, 117047],
            },
            {
                "params": {
                    "query_data": QueryData(
                        code=CodeSearchParam(
                            value="-", type=d.CodeSearchParamType.POSIX
                        ),
                        description="lip",
                    ),
                    "ontology_id": "ICD-10-CM",
                },
                "want": [24621, 51941, 112848],
            },
        ]

        for test in tests:
            got = session.code_repository.search_codes(**test["params"])
            assert [c.id for c in got] == test["want"]
