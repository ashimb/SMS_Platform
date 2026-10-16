"""Security controls: IDOR, deny-by-default, token validation, headers, rate limits, errors."""

from __future__ import annotations

import time
from collections.abc import Callable
from typing import Any
from uuid import uuid4

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.core.security import create_token
from tests.conftest import SeededTenantData, bearer
from tests.factories.students import student_payload

pytestmark = pytest.mark.security

Headers = Callable[[str, str], dict[str, str]]


# ---- Authorization -------------------------------------------------------------------------------


def test_idor_on_random_ids_returns_404(client: TestClient, auth_headers: Headers) -> None:
    headers = auth_headers("a", "admin")
    for path in (f"/api/v1/students/{uuid4()}", f"/api/v1/users/{uuid4()}"):
        response = client.get(path, headers=headers)
        assert response.status_code == 404
        assert response.json()["error"]["code"] == "NOT_FOUND"


def test_idor_cross_tenant_student_returns_404_not_403(
    client_factory: Callable[..., TestClient], auth_headers: Headers
) -> None:
    student = (
        client_factory("a")
        .post("/api/v1/students", json=student_payload(), headers=auth_headers("a", "admin"))
        .json()
    )
    response = client_factory("b").get(
        f"/api/v1/students/{student['id']}", headers=auth_headers("b", "admin")
    )
    assert response.status_code == 404  # existence is not revealed (FRD POL-09)


@pytest.mark.parametrize(
    ("role", "method", "path", "body"),
    [
        ("viewer", "get", "/api/v1/students", None),
        ("viewer", "get", "/api/v1/users", None),
        ("viewer", "get", "/api/v1/audit-logs", None),
        ("viewer", "get", "/api/v1/roles", None),
        ("teacher", "post", "/api/v1/students", "student"),
        ("teacher", "get", "/api/v1/audit-logs", None),
        ("teacher", "patch", f"/api/v1/users/{uuid4()}", {"full_name": "X"}),
    ],
)
def test_missing_permission_is_forbidden(
    *,
    client: TestClient,
    auth_headers: Headers,
    role: str,
    method: str,
    path: str,
    body: Any,
) -> None:
    json_body = student_payload() if body == "student" else body
    response = client.request(method, path, json=json_body, headers=auth_headers("a", role))
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


def test_teacher_can_read_but_not_update_students(
    client: TestClient, auth_headers: Headers
) -> None:
    student = client.post(
        "/api/v1/students", json=student_payload(), headers=auth_headers("a", "admin")
    ).json()
    teacher = auth_headers("a", "teacher")
    assert client.get(f"/api/v1/students/{student['id']}", headers=teacher).status_code == 200
    patch = client.patch(
        f"/api/v1/students/{student['id']}", json={"section": "Q"}, headers=teacher
    )
    assert patch.status_code == 403


# ---- Authentication / tokens --------------------------------------------------------------------


def _forged_token(tenants: dict[str, SeededTenantData], **claim_overrides: Any) -> str:
    settings = get_settings()
    now = int(time.time())
    payload = {
        "sub": str(tenants["a"].users["admin"].user_id),
        "tid": str(tenants["a"].tenant.tenant_id),
        "jti": "forged",
        "type": "access",
        "iat": now,
        "exp": now + 300,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        **claim_overrides,
    }
    return jwt.encode(payload, Ed25519PrivateKey.generate(), algorithm="EdDSA")


@pytest.mark.parametrize(
    "token_kind", ["missing", "garbage", "expired", "forged", "alg_none", "wrong_audience"]
)
def test_invalid_tokens_are_unauthorised(
    client: TestClient, tenants: dict[str, SeededTenantData], token_kind: str
) -> None:
    admin = tenants["a"].users["admin"]
    tenant_id = tenants["a"].tenant.tenant_id
    headers: dict[str, str]
    if token_kind == "missing":
        headers = {}
    elif token_kind == "garbage":
        headers = bearer("not.a.jwt")
    elif token_kind == "expired":
        token, _ = create_token(
            subject=admin.user_id, tenant_id=tenant_id, kind="access", ttl_seconds=-120
        )
        headers = bearer(token)
    elif token_kind == "forged":
        headers = bearer(_forged_token(tenants))
    elif token_kind == "alg_none":
        headers = bearer(
            jwt.encode({"sub": str(admin.user_id), "tid": str(tenant_id)}, None, algorithm="none")
        )
    else:
        settings = get_settings()
        now = int(time.time())
        token = jwt.encode(
            {
                "sub": str(admin.user_id),
                "tid": str(tenant_id),
                "jti": "x",
                "type": "access",
                "iat": now,
                "exp": now + 300,
                "iss": settings.jwt_issuer,
                "aud": "some-other-service",
            },
            _signing_key(),
            algorithm="EdDSA",
        )
        headers = bearer(token)

    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401
    assert response.json()["error"]["code"] in {"UNAUTHENTICATED", "INVALID_TOKEN"}


def _signing_key() -> Any:
    from cryptography.hazmat.primitives import serialization

    return serialization.load_pem_private_key(get_settings().signing_key_pem(), password=None)


def test_valid_signature_for_deleted_user_is_rejected(
    client: TestClient, tenants: dict[str, SeededTenantData]
) -> None:
    token, _ = create_token(subject=uuid4(), tenant_id=tenants["a"].tenant.tenant_id, kind="access")
    assert client.get("/api/v1/auth/me", headers=bearer(token)).status_code == 401


# ---- Headers ------------------------------------------------------------------------------------


@pytest.mark.parametrize("path", ["/health", "/api/v1/tenant", "/api/v1/does-not-exist"])
def test_security_headers_present(client: TestClient, path: str) -> None:
    response = client.get(path)
    headers = response.headers
    assert "default-src 'none'" in headers["content-security-policy"]
    assert "frame-ancestors 'none'" in headers["content-security-policy"]
    assert headers["strict-transport-security"].startswith("max-age=")
    assert headers["x-content-type-options"] == "nosniff"
    assert headers["x-frame-options"] == "DENY"
    assert headers["referrer-policy"] == "no-referrer"
    assert headers["cache-control"] == "no-store"
    assert len(headers["x-request-id"]) >= 8
    assert "server" not in {k.lower() for k in headers}


def test_unsafe_incoming_request_id_is_replaced(client: TestClient) -> None:
    response = client.get("/health", headers={"X-Request-ID": "<script>alert(1)</script>"})
    assert "<" not in response.headers["x-request-id"]


def test_no_cors_headers_for_foreign_origin(client: TestClient) -> None:
    response = client.get("/api/v1/tenant", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in response.headers


# ---- Rate limiting ------------------------------------------------------------------------------


def test_login_rate_limit_triggers(client: TestClient) -> None:
    limit = get_settings().rate_limit_auth
    statuses = [
        client.post(
            "/api/v1/auth/login", json={"email": "nobody@a.example.com", "password": "x" * 12}
        ).status_code
        for _ in range(limit + 1)
    ]
    assert statuses[:limit] == [401] * limit
    assert statuses[-1] == 429
    blocked = client.post(
        "/api/v1/auth/login", json={"email": "nobody@a.example.com", "password": "x" * 12}
    )
    assert blocked.status_code == 429
    assert int(blocked.headers["retry-after"]) >= 1
    assert blocked.json()["error"]["code"] == "RATE_LIMITED"


def test_rate_limits_are_per_tenant(client_factory: Callable[..., TestClient]) -> None:
    client_a, client_b = client_factory("a"), client_factory("b")
    limit = get_settings().rate_limit_auth
    for _ in range(limit + 1):
        client_a.post("/api/v1/auth/login", json={"email": "x@a.example.com", "password": "y" * 12})
    response = client_b.post(
        "/api/v1/auth/login", json={"email": "x@b.example.com", "password": "y" * 12}
    )
    assert response.status_code == 401  # tenant B's budget is untouched


# ---- Error envelope -----------------------------------------------------------------------------


def _assert_envelope(body: dict[str, Any]) -> None:
    assert set(body) == {"error"}
    assert set(body["error"]) == {"code", "message", "details", "trace_id"}


def test_not_found_route_uses_envelope(client: TestClient) -> None:
    response = client.get("/api/v1/nope")
    assert response.status_code == 404
    _assert_envelope(response.json())


def test_validation_error_does_not_echo_input(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login", json={"email": "not-an-email", "password": "SuperSecret-Value-1"}
    )
    assert response.status_code == 422
    _assert_envelope(response.json())
    assert "SuperSecret-Value-1" not in response.text
    assert "not-an-email" not in response.text


def test_unhandled_error_hides_internals(
    app: Any, auth_headers: Headers, client_factory: Callable[..., TestClient]
) -> None:
    from app.modules.students.router import get_service

    class Exploding:
        def list_students(self, *_: Any, **__: Any) -> Any:
            raise RuntimeError("SELECT password_hash FROM users WHERE 1=1 -- hunter2")

    headers = auth_headers("a", "admin")
    app.dependency_overrides[get_service] = Exploding
    try:
        client = client_factory("a", raise_server_exceptions=False)
        response = client.get("/api/v1/students", headers=headers)
    finally:
        app.dependency_overrides.pop(get_service, None)

    assert response.status_code == 500
    body = response.json()
    _assert_envelope(body)
    assert body["error"]["code"] == "INTERNAL_ERROR"
    for leaked in ("SELECT", "hunter2", "Traceback", "RuntimeError", "password_hash"):
        assert leaked not in response.text
    assert body["error"]["trace_id"] == response.headers["x-request-id"]


def test_database_integrity_error_hides_sql(
    client: TestClient, auth_headers: Headers, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app.modules.students.repository import StudentRepository

    headers = auth_headers("a", "admin")
    payload = student_payload()
    assert client.post("/api/v1/students", json=payload, headers=headers).status_code == 201
    # Skip the service's duplicate pre-check so MySQL's unique constraint fires.
    monkeypatch.setattr(StudentRepository, "get_by_admission_no", lambda self, no: None)
    response = client.post("/api/v1/students", json=payload, headers=headers)
    assert response.status_code == 409
    _assert_envelope(response.json())
    assert "Duplicate entry" not in response.text
    assert "uq_students" not in response.text


# ---- Configuration ------------------------------------------------------------------------------


def test_production_refuses_missing_secrets() -> None:
    with pytest.raises(ValidationError, match="Insecure configuration"):
        Settings(app_env="production", _env_file=None)  # type: ignore[call-arg]


def test_production_refuses_placeholder_secrets() -> None:
    with pytest.raises(ValidationError, match="placeholder"):
        Settings(  # type: ignore[call-arg]
            app_env="production",
            db_password="change-me-mysql-app",
            redis_password="real-redis-secret",
            mfa_encryption_key="real-key",
            jwt_signing_key="pem",
            _env_file=None,
        )


def test_cors_wildcard_rejected() -> None:
    with pytest.raises(ValidationError, match="explicit origins"):
        Settings(cors_origins=["*"], _env_file=None)  # type: ignore[call-arg]


def test_docs_disabled_in_production() -> None:
    from app.main import create_app

    settings = Settings(  # type: ignore[call-arg]
        app_env="production",
        db_password="prod-db-secret",
        redis_password="prod-redis-secret",
        mfa_encryption_key="prod-mfa-key",
        jwt_signing_key=get_settings().signing_key_pem().decode(),
        _env_file=None,
    )
    app = create_app(settings)
    client = TestClient(app, base_url="https://school-a.test")
    assert client.get("/api/v1/openapi.json").status_code == 404
    assert client.get("/api/docs").status_code == 404
