import subprocess

import pytest
from fastapi.testclient import TestClient

import app as api


@pytest.fixture()
def client(monkeypatch):
    monkeypatch.setattr(api, "INTERNAL_API_KEY", "test-internal-key-that-is-long-enough-123")
    return TestClient(api.app)


def auth_headers():
    return {"Authorization": "Bearer test-internal-key-that-is-long-enough-123"}


def test_headlines_requires_authentication(client):
    response = client.post("/analyze/headlines", json={"headlines": ["Vehicle prices rise"]})
    assert response.status_code == 401


def test_headlines_categorizes_and_bounds_input(client):
    response = client.post(
        "/analyze/headlines",
        headers=auth_headers(),
        json={"headlines": [" Vehicle prices rise due to inflation ", "A local showroom opens"]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 2
    assert body["items"][0]["headline"] == "Vehicle prices rise due to inflation"
    assert "pricing" in body["items"][0]["topics"]
    assert body["items"][1]["topics"] == ["unclassified"]


def test_headlines_rejects_empty_batch(client):
    response = client.post("/analyze/headlines", headers=auth_headers(), json={"headlines": []})
    assert response.status_code == 422


def test_inventory_score_validates_and_calls_helper(client, monkeypatch):
    def fake_run(args, **kwargs):
        assert args == ["/usr/local/bin/inventory_priority", "30", "1", "0"]
        return subprocess.CompletedProcess(args, 0, '{"score":20,"meaning":"advisory"}', "")

    monkeypatch.setattr(api.subprocess, "run", fake_run)
    response = client.post(
        "/score/inventory",
        headers=auth_headers(),
        json={"days_in_stock": 30, "published": True, "featured": False},
    )
    assert response.status_code == 200
    assert response.json()["score"] == 20


def test_inventory_score_rejects_out_of_range_days(client):
    response = client.post(
        "/score/inventory",
        headers=auth_headers(),
        json={"days_in_stock": 36501, "published": True, "featured": False},
    )
    assert response.status_code == 422


def test_inventory_score_hides_helper_failures(client, monkeypatch):
    def fail_run(*args, **kwargs):
        raise subprocess.CalledProcessError(2, "inventory_priority")

    monkeypatch.setattr(api.subprocess, "run", fail_run)
    response = client.post(
        "/score/inventory",
        headers=auth_headers(),
        json={"days_in_stock": 30, "published": True, "featured": False},
    )
    assert response.status_code == 503
    assert response.json()["detail"] == "Inventory scoring helper unavailable"


def test_health_reports_missing_database_config(client, monkeypatch):
    monkeypatch.setattr(api, "DATABASE_URL", "")
    response = client.get("/health")
    assert response.status_code == 503
