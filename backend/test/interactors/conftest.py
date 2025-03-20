from unittest.mock import create_autospec

import pytest

import medconb.domain as d
from medconb.types import (
    CodelistRepository,
    CollectionRepository,
    PropertyRepository,
    Session,
)

from ..helper import _u_id


@pytest.fixture
def user():
    workspace = d.Workspace(id="workspace_id", collection_ids=[])
    return d.User(id=_u_id(1), external_id="XYZ", name="Test User", workspace=workspace)


@pytest.fixture
def session():
    session = create_autospec(Session)
    session.collection_repository = create_autospec(CollectionRepository)
    session.codelist_repository = create_autospec(CodelistRepository)
    session.property_repository = create_autospec(PropertyRepository)

    session.property_repository.get_all.return_value = [
        d.Property(
            id=3,
            name="Created",
            class_name=d.PropertyClass.Collection,
            dtype=d.PropertyDtype.Time,
            dtype_meta={},
            required=False,
            read_only=True,
        ),
        d.Property(
            id=4,
            name="Created By",
            class_name=d.PropertyClass.Collection,
            dtype=d.PropertyDtype.User,
            dtype_meta={},
            required=False,
            read_only=True,
        ),
        d.Property(
            id=5,
            name="Last Edited",
            class_name=d.PropertyClass.Collection,
            dtype=d.PropertyDtype.Time,
            dtype_meta={},
            required=False,
            read_only=True,
        ),
        d.Property(
            id=6,
            name="Last Edited By",
            class_name=d.PropertyClass.Collection,
            dtype=d.PropertyDtype.User,
            dtype_meta={},
            required=False,
            read_only=True,
        ),
    ]

    return session
