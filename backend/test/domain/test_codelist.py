from copy import deepcopy
from datetime import datetime

import pytest

import medconb.domain as d


def test_cs_has_repr():
    cs = d.Codeset("ICD-10-CM", [])

    got = repr(cs)

    assert got is not None
    assert "Codeset" in got


def test_codelist_has_repr():
    cl = d.Codelist(
        id=1,
        name="CL 1",
        description="",
        commits=[],
        transient_commit=None,
        container=d.ContainerSpec(type_=d.Collection, id=1),
    )

    got = repr(cl)

    assert got is not None
    assert "Codelist" in got


def test_cs_number_of_codes():
    cs = d.Codeset("ICD-10-CM", [53, 24, 95, 22, 42])

    assert cs.number_of_codes == 5


class TestChangeset:
    def test_deepcopy(self):
        changeset = d.Changeset(
            "ICD10", d.SetOfCodeIds([1, 2, 4, 9]), d.SetOfCodeIds([])
        )

        got = deepcopy(changeset)

        assert id(changeset) != id(got)

        assert id(changeset) != id(got)
        assert id(changeset.code_ids_added) != id(got.code_ids_added)
        assert id(changeset.code_ids_removed) != id(got.code_ids_removed)
        assert changeset.ontology_id == got.ontology_id
        assert changeset.code_ids_added == got.code_ids_added
        assert changeset.code_ids_removed == got.code_ids_removed


class TestCommit:
    def test_deepcopy(self):
        commit = d.Commit(
            [
                d.Changeset("ICD10", [1, 2, 4, 9], []),
                d.Changeset("ICD9", [3, 5, 7], []),
            ],
            1,
            datetime.now(),
            "foo",
        )

        got = deepcopy(commit)

        assert id(commit) != id(got)
        assert id(commit.changesets) != id(got.changesets)
        assert commit.author_id == got.author_id
        assert commit.created_at == got.created_at
        assert commit.message == got.message


class TestSetOfCodeIds:
    def test_add_throws_when_exists(self):
        cl = d.SetOfCodeIds([1, 2, 3])

        with pytest.raises(ValueError):
            cl.add(2)

    def test_add_all_good(self):
        cl = d.SetOfCodeIds([1, 2, 3])
        cl.add(4)

        assert cl == d.SetOfCodeIds([1, 2, 3, 4])

    def test_or_throws_when_exists(self):
        cl = d.SetOfCodeIds([1, 2, 3])

        with pytest.raises(ValueError):
            cl | d.SetOfCodeIds([2])

    def test_or_all_good(self):
        cl = d.SetOfCodeIds([1, 2, 3])
        got = cl | d.SetOfCodeIds([4])

        assert got == d.SetOfCodeIds([1, 2, 3, 4])

    def test_ior_throws_when_exists(self):
        cl = d.SetOfCodeIds([1, 2, 3])

        with pytest.raises(ValueError):
            cl |= d.SetOfCodeIds([2])

    def test_ior_all_good(self):
        cl = d.SetOfCodeIds([1, 2, 3])
        cl |= d.SetOfCodeIds([4])

    def test_sub_throws_when_not_exists(self):
        cl = d.SetOfCodeIds([1, 2, 3])

        with pytest.raises(ValueError):
            cl - d.SetOfCodeIds([4])

    def test_sub_all_good(self):
        cl = d.SetOfCodeIds([1, 2, 3])
        got = cl - d.SetOfCodeIds([2])

        assert got == d.SetOfCodeIds([1, 3])

    def test_isub_throws_when_not_exists(self):
        cl = d.SetOfCodeIds([1, 2, 3])

        with pytest.raises(ValueError):
            cl -= d.SetOfCodeIds([4])

    def test_isub_all_good(self):
        cl = d.SetOfCodeIds([1, 2, 3])
        cl -= d.SetOfCodeIds([2])

        assert cl == d.SetOfCodeIds([1, 3])


class TestVersion:
    def test_add_is_immutable(self):
        version = d.Codesets(
            [d.Codeset(ontology_id="ICD-10-CM", code_ids=d.SetOfCodeIds([99]))],
            version=1,
        )
        commit = d.Commit(
            author_id=1,
            created_at=datetime.now(),
            message="foo",
            changesets=[
                d.Changeset(
                    ontology_id="ICD-10-CM", code_ids_added=d.SetOfCodeIds([1, 2, 3])
                )
            ],
        )

        got = version + commit

        assert id(got) != id(version)
        assert id(got[0]) != id(version[0])
        assert id(got[0].code_ids) != id(version[0].code_ids)

    def test_all_changes_applied(self):
        # multiple test cases ...
        test_cases_versions = [
            d.Codesets(
                [],
                version=1,
            ),
            d.Codesets(
                [d.Codeset(ontology_id="ICD-10-CM", code_ids=d.SetOfCodeIds([99]))],
                version=1,
            ),
        ]

        # ... on which these commits will be applied consecutively
        test_cases_commits = [
            d.Commit(
                author_id=1,
                created_at=datetime.now(),
                message="foo",
                changesets=[
                    d.Changeset(
                        ontology_id="ICD-10-CM",
                        code_ids_added=d.SetOfCodeIds([1, 2, 3]),
                    )
                ],
            ),
            d.Commit(
                author_id=1,
                created_at=datetime.now(),
                message="bar",
                changesets=[
                    d.Changeset(
                        ontology_id="ICD-10-CM", code_ids_removed=d.SetOfCodeIds([2])
                    )
                ],
            ),
            d.Commit(
                author_id=1,
                created_at=datetime.now(),
                message="foobar",
                changesets=[
                    d.Changeset(
                        ontology_id="ICD-9-CM", code_ids_added=d.SetOfCodeIds([42])
                    )
                ],
            ),
        ]

        want = [
            [
                d.Codesets(
                    [
                        d.Codeset(
                            ontology_id="ICD-10-CM", code_ids=d.SetOfCodeIds([1, 2, 3])
                        )
                    ],
                    version=1,
                ),
                d.Codesets(
                    [
                        d.Codeset(
                            ontology_id="ICD-10-CM", code_ids=d.SetOfCodeIds([1, 3])
                        )
                    ],
                    version=2,
                ),
                d.Codesets(
                    [
                        d.Codeset(
                            ontology_id="ICD-10-CM", code_ids=d.SetOfCodeIds([1, 3])
                        ),
                        d.Codeset(
                            ontology_id="ICD-9-CM", code_ids=d.SetOfCodeIds([42])
                        ),
                    ],
                    version=3,
                ),
            ],
            [
                d.Codesets(
                    [
                        d.Codeset(
                            ontology_id="ICD-10-CM",
                            code_ids=d.SetOfCodeIds([1, 2, 3, 99]),
                        )
                    ],
                    version=1,
                ),
                d.Codesets(
                    [
                        d.Codeset(
                            ontology_id="ICD-10-CM", code_ids=d.SetOfCodeIds([1, 3, 99])
                        )
                    ],
                    version=2,
                ),
                d.Codesets(
                    [
                        d.Codeset(
                            ontology_id="ICD-10-CM", code_ids=d.SetOfCodeIds([1, 3, 99])
                        ),
                        d.Codeset(
                            ontology_id="ICD-9-CM", code_ids=d.SetOfCodeIds([42])
                        ),
                    ],
                    version=3,
                ),
            ],
        ]

        for idx_v, version in enumerate(test_cases_versions):
            for idx_c, commit in enumerate(test_cases_commits):
                version = version + commit
                assert version == want[idx_v][idx_c]


def test_squash_codelist():  # noqa: R901 - too complex
    source = d.Codelist(
        id=1,
        name="CL 1",
        description="CL 1 Description",
        commits=[
            d.Commit(
                [
                    d.Changeset("ICD10", [1, 2, 4, 9], []),
                    d.Changeset("ICD9", [3, 5, 7], []),
                ],
                2,
                datetime.now(),
                "foo",
            ),
            d.Commit(
                [
                    d.Changeset("ICD10", [11], [1]),
                    d.Changeset("ICD9", [13], [3]),
                ],
                2,
                datetime.now(),
                "bar",
            ),
        ],
        transient_commit=d.Commit(
            [d.Changeset("ICD10", [], [2])],
            2,
            datetime.now(),
            "transient",
        ),
        container=d.ContainerSpec(type_=d.ContainerType.Collection, id=1),
        reference_id=42,
    )

    got = d.squash_codelist(codelist=source, new_id=2, author_id=1)

    assert got.id == 2
    assert got.name == source.name
    assert got.description.endswith(source.description)
    assert got.description.startswith("Squashed from")
    assert len(got.commits) == 1
    assert len(got.commits[0].changesets) == 2
    assert got.commits[0].author_id == 1
    assert got.commits[0].message.startswith("Squashed from")
    assert got.transient_commit
    assert got.transient_commit.author_id == 1
    assert got.container == source.container
    assert got.reference_id == source.id


class TestAddCommit:
    def test_transient_commit_gets_deleted(self):
        codelist = d.Codelist(
            id=42,
            name="CL",
            description="",
            commits=[],
            transient_commit=d.Commit([], 1, datetime.now(), "transient"),
            container=d.ContainerSpec(type_=d.ContainerType.Collection, id=1),
        )

        codelist.add_commit(d.Commit([], 1, datetime.now(), "persistent"))

        assert codelist.transient_commit is None


def test_author_from_user():
    a = d.Author.from_user(d.User(id=42, external_id="ABC", name="DEF", workspace=None))

    assert a.id == 42
    assert a.external_id == "ABC"
    assert a.name == "DEF"


class TestDeleteCodelist:
    def test_not_present_in_container(self):
        container = d.Collection(
            id=1,
            name="COL",
            description="",
            item_type=d.ItemType.Codelist,
            item_ids=[42],
            _owner_id=1,
        )
        codelist = d.Codelist(
            id=42,
            name="CL",
            description="",
            commits=[],
            transient_commit=None,
            container=d.ContainerSpec(type_=d.ContainerType.Collection, id=1),
        )

        d.delete_codelist(
            container=container,
            codelist=codelist,
            referencing_codelists=[],
        )

        assert codelist.id not in container.item_ids

    def test_referencing_codelists_updated(self):
        container = d.Collection(
            id=1,
            name="COL",
            description="",
            item_type=d.ItemType.Codelist,
            item_ids=[42],
            _owner_id=1,
        )
        codelist = d.Codelist(
            id=42,
            name="CL",
            description="",
            commits=[],
            transient_commit=None,
            container=d.ContainerSpec(type_=d.ContainerType.Collection, id=1),
        )
        referencing_codelists = [
            d.Codelist(
                id=43,
                name="CL",
                description="",
                commits=[],
                transient_commit=None,
                container=d.ContainerSpec(type_=d.ContainerType.Collection, id=1),
                reference_id=42,
            )
        ]

        d.delete_codelist(
            container=container,
            codelist=codelist,
            referencing_codelists=referencing_codelists,
        )

        for cl in referencing_codelists:
            assert cl.reference_id is None
