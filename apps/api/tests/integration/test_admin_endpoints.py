"""Integration: tenant profile, roles, users, and audit endpoints."""

from __future__ import annotations

from collections.abc import Callable

import pytest
from fastapi.testclient import TestClient

from tests.conftest import SeededTenantData

pytestmark = pytest.mark.integration

Headers = Callable[[str, str], dict[str, str]]


def test_public_tenant_profile_needs_no_auth(
    client_factory: Callable[..., TestClient], tenants: dict[str, SeededTenantData]
) -> None:
    for key, expected_name in (("a", "School A"), ("b", "School B")):
        response = client_factory(key).get("/api/v1/tenant")
        assert response.status_code == 200
        assert response.json() == {"slug": tenants[key].tenant.slug, "name": expected_name}


def test_tenant_settings_require_permission(client: TestClient, auth_headers: Headers) -> None:
    assert client.get("/api/v1/tenant/settings").status_code == 401
    assert (
        client.get("/api/v1/tenant/settings", headers=auth_headers("a", "viewer")).status_code
        == 403
    )
    response = client.get("/api/v1/tenant/settings", headers=auth_headers("a", "teacher"))
    assert response.status_code == 200
    body = response.json()
    assert (body["timezone"], body["currency"], body["academic_year_start_month"]) == (
        "Asia/Kolkata",
        "INR",
        4,
    )


def test_roles_list_shows_system_roles(client: TestClient, auth_headers: Headers) -> None:
    response = client.get("/api/v1/roles", headers=auth_headers("a", "admin"))
    assert response.status_code == 200
    roles = {role["code"]: role for role in response.json()}
    assert {"admin", "principal", "teacher", "viewer"} <= set(roles)
    assert roles["viewer"]["permissions"] == []
    assert "students.profile.read" in roles["teacher"]["permissions"]
    assert all(role["is_system"] for role in roles.values())


def test_users_list_get_and_update(
    client: TestClient, auth_headers: Headers, tenants: dict[str, SeededTenantData]
) -> None:
    headers = auth_headers("a", "admin")
    listing = client.get("/api/v1/users", params={"page_size": 200}, headers=headers)
    assert listing.status_code == 200
    emails = {u["email"] for u in listing.json()["items"]}
    assert tenants["a"].users["teacher"].email in emails
    assert all(
        "password_hash" not in u and "mfa_secret_encrypted" not in u
        for u in listing.json()["items"]
    )

    teacher_id = tenants["a"].users["teacher"].user_id
    fetched = client.get(f"/api/v1/users/{teacher_id}", headers=headers)
    assert fetched.status_code == 200

    updated = client.patch(
        f"/api/v1/users/{teacher_id}", json={"full_name": "Teacher Renamed"}, headers=headers
    )
    assert updated.status_code == 200
    assert updated.json()["full_name"] == "Teacher Renamed"

    noop = client.patch(f"/api/v1/users/{teacher_id}", json={}, headers=headers)
    assert noop.status_code == 200

    bad = client.patch(f"/api/v1/users/{teacher_id}", json={"email": "x@y.com"}, headers=headers)
    assert bad.status_code == 422  # unknown/unsupported fields are rejected


def test_audit_log_filter_and_viewing_is_audited(client: TestClient, auth_headers: Headers) -> None:
    headers = auth_headers("a", "admin")
    first = client.get(
        "/api/v1/audit-logs", params={"action": "auth.login.succeeded"}, headers=headers
    )
    assert first.status_code == 200
    assert all(item["action"] == "auth.login.succeeded" for item in first.json()["items"])

    viewed = client.get(
        "/api/v1/audit-logs", params={"action": "audit.log.viewed"}, headers=headers
    ).json()
    assert viewed["total"] >= 1


def test_health_and_ready(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "ok"}
    assert client.get("/health/live").status_code == 200
    ready = client.get("/ready")
    assert ready.status_code == 200
    assert ready.json()["checks"] == {"database": "ok", "redis": "ok"}


def test_openapi_available_outside_production(client: TestClient) -> None:
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    assert "/api/v1/students" in response.json()["paths"]
