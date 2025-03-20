from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from starlette.testclient import TestClient


def test_status(client: "TestClient"):
    response = client.get("/")
    body = response.json()
    assert body["status"] == "ok"
