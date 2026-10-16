"""Integration: login, refresh rotation, reuse detection, logout, lockout, MFA."""

from __future__ import annotations

import time
from collections.abc import Callable
from typing import Any
from urllib.parse import parse_qs, urlparse

import pyotp
import pytest
from fastapi.testclient import TestClient

from tests.conftest import DEFAULT_PASSWORD, SeededTenantData, SeededUser, bearer, login

pytestmark = pytest.mark.integration

CSRF = {"X-SP-CSRF": "1"}
REFRESH_COOKIE = "__Secure-sp_rt"


def _set_cookie_header(response: Any) -> str:
    return "; ".join(response.headers.get_list("set-cookie"))


def test_login_returns_access_token_and_secure_refresh_cookie(
    client: TestClient, tenants: dict[str, SeededTenantData]
) -> None:
    user = tenants["a"].users["admin"]
    response = client.post(
        "/api/v1/auth/login", json={"email": user.email, "password": user.password}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["token_type"] == "bearer"
    assert body["expires_in"] <= 900
    assert "refresh_token" not in body

    cookie = _set_cookie_header(response).lower()
    assert REFRESH_COOKIE.lower() in cookie
    assert "httponly" in cookie
    assert "secure" in cookie
    assert "samesite=strict" in cookie
    assert "path=/api/v1/auth" in cookie


def test_me_returns_roles_and_permissions(
    client: TestClient, tenants: dict[str, SeededTenantData]
) -> None:
    user = tenants["a"].users["teacher"]
    token = login(client, user.email)
    response = client.get("/api/v1/auth/me", headers=bearer(token))
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == user.email
    assert body["roles"] == ["teacher"]
    assert "students.profile.read" in body["permissions"]
    assert "students.profile.create" not in body["permissions"]
    assert "password_hash" not in body


def test_unknown_email_and_wrong_password_are_indistinguishable(
    client: TestClient, tenants: dict[str, SeededTenantData]
) -> None:
    known = tenants["a"].users["viewer"]
    wrong_password = client.post(
        "/api/v1/auth/login", json={"email": known.email, "password": "not-the-password"}
    )
    unknown_user = client.post(
        "/api/v1/auth/login", json={"email": "nobody@a.example.com", "password": "whatever-123"}
    )
    assert wrong_password.status_code == unknown_user.status_code == 401
    a, b = wrong_password.json()["error"], unknown_user.json()["error"]
    assert (
        (a["code"], a["message"])
        == (b["code"], b["message"])
        == (
            "INVALID_CREDENTIALS",
            "Incorrect email or password.",
        )
    )


def test_lockout_after_threshold_blocks_correct_password(
    client: TestClient, make_user: Callable[..., SeededUser]
) -> None:
    user = make_user("a", "viewer")
    for _ in range(5):
        response = client.post(
            "/api/v1/auth/login", json={"email": user.email, "password": "wrong-password-1"}
        )
        assert response.status_code == 401

    locked = client.post(
        "/api/v1/auth/login", json={"email": user.email, "password": DEFAULT_PASSWORD}
    )
    assert locked.status_code == 401
    assert locked.json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_lockout_is_audited(
    client: TestClient,
    make_user: Callable[..., SeededUser],
    auth_headers: Callable[[str, str], dict[str, str]],
) -> None:
    user = make_user("a", "viewer")
    for _ in range(5):
        client.post("/api/v1/auth/login", json={"email": user.email, "password": "bad-password-xx"})
    logs = client.get(
        "/api/v1/audit-logs",
        params={"action": "auth.account.locked"},
        headers=auth_headers("a", "admin"),
    )
    assert logs.status_code == 200
    assert any(item["entity_id"] == str(user.user_id) for item in logs.json()["items"])


def test_refresh_rotates_tokens(client: TestClient, tenants: dict[str, SeededTenantData]) -> None:
    login(client, tenants["a"].users["admin"].email)
    first_cookie = client.cookies.get(REFRESH_COOKIE)
    assert first_cookie

    response = client.post("/api/v1/auth/refresh", headers=CSRF)
    assert response.status_code == 200, response.text
    second_cookie = client.cookies.get(REFRESH_COOKIE)
    assert second_cookie and second_cookie != first_cookie

    me = client.get("/api/v1/auth/me", headers=bearer(response.json()["access_token"]))
    assert me.status_code == 200


def test_refresh_reuse_revokes_whole_session(
    client_factory: Callable[..., TestClient], tenants: dict[str, SeededTenantData]
) -> None:
    client = client_factory("a")
    access = login(client, tenants["a"].users["admin"].email)
    stolen = client.cookies.get(REFRESH_COOKIE)
    assert stolen

    rotated = client.post("/api/v1/auth/refresh", headers=CSRF)
    assert rotated.status_code == 200
    new_access = rotated.json()["access_token"]

    # An attacker replays the old (already rotated) refresh token.
    attacker = client_factory("a")
    attacker.cookies.set(REFRESH_COOKIE, stolen, domain=tenants["a"].host, path="/api/v1/auth")
    replay = attacker.post("/api/v1/auth/refresh", headers=CSRF)
    assert replay.status_code == 401

    # The legitimate user's newest refresh token is revoked too ...
    assert client.post("/api/v1/auth/refresh", headers=CSRF).status_code == 401
    # ... and access tokens of the session stop working immediately.
    for token in (access, new_access):
        response = client.get("/api/v1/auth/me", headers=bearer(token))
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "SESSION_REVOKED"


def test_refresh_requires_csrf_header(
    client: TestClient, tenants: dict[str, SeededTenantData]
) -> None:
    login(client, tenants["a"].users["admin"].email)
    response = client.post("/api/v1/auth/refresh")
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "CSRF_FAILED"


def test_refresh_without_cookie_is_rejected(client: TestClient) -> None:
    response = client.post("/api/v1/auth/refresh", headers=CSRF)
    assert response.status_code == 401


def test_logout_revokes_refresh_and_access(
    client: TestClient, tenants: dict[str, SeededTenantData]
) -> None:
    access = login(client, tenants["a"].users["admin"].email)
    old_cookie = client.cookies.get(REFRESH_COOKIE)

    response = client.post("/api/v1/auth/logout", headers={**CSRF, **bearer(access)})
    assert response.status_code == 204

    assert client.get("/api/v1/auth/me", headers=bearer(access)).status_code == 401
    client.cookies.set(
        REFRESH_COOKIE, old_cookie or "", domain=tenants["a"].host, path="/api/v1/auth"
    )
    assert client.post("/api/v1/auth/refresh", headers=CSRF).status_code == 401


def test_mfa_enrolment_and_login_challenge(
    client: TestClient, make_user: Callable[..., SeededUser]
) -> None:
    user = make_user("a", "admin")
    token = login(client, user.email)

    enrol = client.post("/api/v1/auth/mfa/totp/enrol", headers=bearer(token))
    assert enrol.status_code == 200
    body = enrol.json()
    assert body["qr_svg"].lstrip().startswith("<")
    secret = parse_qs(urlparse(body["otpauth_uri"]).query)["secret"][0]
    totp = pyotp.TOTP(secret)

    verify = client.post(
        "/api/v1/auth/mfa/totp/verify", json={"code": totp.now()}, headers=bearer(token)
    )
    assert verify.status_code == 204

    first_step = client.post(
        "/api/v1/auth/login", json={"email": user.email, "password": user.password}
    )
    assert first_step.status_code == 200
    challenge = first_step.json()
    assert challenge["status"] == "mfa_required"
    assert "access_token" not in challenge

    # The code used for enrolment cannot be replayed; the next time step is accepted.
    replay = client.post(
        "/api/v1/auth/mfa/challenge",
        json={"mfa_token": challenge["mfa_token"], "code": totp.now()},
    )
    assert replay.status_code == 401
    assert replay.json()["error"]["code"] == "MFA_INVALID"

    next_code = totp.at(time.time() + totp.interval)
    ok = client.post(
        "/api/v1/auth/mfa/challenge",
        json={"mfa_token": challenge["mfa_token"], "code": next_code},
    )
    assert ok.status_code == 200, ok.text
    assert client.get("/api/v1/auth/me", headers=bearer(ok.json()["access_token"])).json()[
        "mfa_enabled"
    ]


def test_mfa_token_cannot_be_used_as_access_token(
    client: TestClient, make_user: Callable[..., SeededUser]
) -> None:
    user = make_user("a", "admin")
    token = login(client, user.email)
    secret = parse_qs(
        urlparse(
            client.post("/api/v1/auth/mfa/totp/enrol", headers=bearer(token)).json()["otpauth_uri"]
        ).query
    )["secret"][0]
    client.post(
        "/api/v1/auth/mfa/totp/verify",
        json={"code": pyotp.TOTP(secret).now()},
        headers=bearer(token),
    )
    mfa_token = client.post(
        "/api/v1/auth/login", json={"email": user.email, "password": user.password}
    ).json()["mfa_token"]
    assert client.get("/api/v1/auth/me", headers=bearer(mfa_token)).status_code == 401
