#!/usr/bin/env python3
"""HTTP integration checks against a disposable PostgreSQL database and PHP API."""
import json
import os
import urllib.error
import urllib.request

BASE_URL = os.environ.get("API_BASE_URL", "http://127.0.0.1:8080")
KEY = os.environ["INTERNAL_API_KEY"]


def request(path, method="GET", token=None):
    headers = {"Accept": "application/json"}
    if token is not None:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE_URL}{path}", method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.status, json.loads(response.read())
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read())


def main():
    status, health = request("/health")
    assert status == 200 and health["database"] == "connected", (status, health)

    status, public = request("/api/vehicles")
    assert status == 200 and isinstance(public.get("data"), list), (status, public)
    by_id = {row["id"]: row for row in public["data"]}
    assert "vehicle-public" in by_id, "published/available vehicle missing from public inventory"
    assert "vehicle-draft" not in by_id, "unpublished vehicle leaked into public inventory"
    assert "vehicle-sold" not in by_id, "sold vehicle leaked into public inventory"
    assert by_id["vehicle-public"]["images"][0]["url"] == "https://example.test/car.jpg"

    status, denied = request("/api/internal/vehicles")
    assert status == 401 and denied.get("error") == "Unauthorized", (status, denied)

    status, internal = request("/api/internal/vehicles", token=KEY)
    assert status == 200 and isinstance(internal.get("data"), list), (status, internal)
    internal_ids = {row["id"] for row in internal["data"]}
    assert {"vehicle-public", "vehicle-draft", "vehicle-sold"} <= internal_ids

    status, missing = request("/does-not-exist")
    assert status == 404 and missing.get("error") == "Not found", (status, missing)
    print("PASS: database readiness, live inventory SQL, publication/status filtering, images, internal bearer auth, and HTTP routing")


if __name__ == "__main__":
    main()
