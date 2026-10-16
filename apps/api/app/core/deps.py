"""Shared FastAPI dependencies: settings, unit of work, Redis, tenant, authenticated principal.

`core` never imports `app.modules` (import-linter contract). Loading a principal's roles and
permissions is module logic, so the app factory registers a `PrincipalLoader` on
`app.state.principal_loader`; this module only calls it.
"""

from __future__ import annotations

from collections.abc import Callable, Iterator
from dataclasses import dataclass
from typing import Annotated
from uuid import UUID

import redis
import structlog
from fastapi import Depends, Request
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import Settings, get_settings
from app.core.errors import ForbiddenError, ServiceUnavailableError, UnauthorizedError
from app.core.middleware.audit_context import get_audit_context
from app.core.security import TokenError, decode_token
from app.core.tenancy import TenantContext, get_tenant_context
from app.db.session import get_session_factory
from app.db.uow import UnitOfWork

logger = structlog.get_logger(__name__)


@dataclass(frozen=True, slots=True)
class Principal:
    """The authenticated actor for a request. Permissions are effective for this tenant only."""

    user_id: UUID
    tenant_id: UUID
    session_id: UUID | None
    roles: frozenset[str]
    permissions: frozenset[str]

    def has(self, permission: str) -> bool:
        return permission in self.permissions


PrincipalLoader = Callable[[Session, TenantContext, UUID, UUID | None], Principal | None]


def settings_dep() -> Settings:
    return get_settings()


def get_uow(request: Request) -> Iterator[UnitOfWork]:
    factory: sessionmaker[Session] = (
        getattr(request.app.state, "session_factory", None) or get_session_factory()
    )
    with UnitOfWork(factory) as uow:
        yield uow


def get_redis(request: Request) -> redis.Redis:
    client: redis.Redis | None = getattr(request.app.state, "redis", None)
    if client is None:
        raise ServiceUnavailableError()
    return client


def revoked_session_key(tenant: TenantContext, session_id: UUID) -> str:
    return tenant.cache_key("auth", "revoked_session", str(session_id))


def _bearer_token(request: Request) -> str:
    header = request.headers.get("authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise UnauthorizedError()
    return token.strip()


def get_current_principal(
    request: Request,
    tenant: Annotated[TenantContext, Depends(get_tenant_context)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> Principal:
    token = _bearer_token(request)
    try:
        claims = decode_token(token, expected_type="access")
    except TokenError:
        raise UnauthorizedError(
            "Your session is invalid or has expired.", code="INVALID_TOKEN"
        ) from None

    if claims.tid != tenant.tenant_id:
        logger.warning("security.tenant_mismatch", token_tenant=str(claims.tid))
        raise UnauthorizedError("Your session is invalid or has expired.", code="INVALID_TOKEN")

    if claims.sid is not None:
        client = getattr(request.app.state, "redis", None)
        try:
            revoked = (
                bool(client.exists(revoked_session_key(tenant, claims.sid))) if client else False
            )
        except redis.RedisError:
            # Fail closed: without the revocation list we cannot trust the token.
            raise ServiceUnavailableError() from None
        if revoked:
            raise UnauthorizedError("Your session has ended.", code="SESSION_REVOKED")

    loader: PrincipalLoader | None = getattr(request.app.state, "principal_loader", None)
    if loader is None:
        raise RuntimeError("principal_loader is not configured on the application")
    principal = loader(uow.session, tenant, claims.sub, claims.sid)
    if principal is None:
        raise UnauthorizedError("Your session is invalid or has expired.", code="INVALID_TOKEN")

    audit = get_audit_context()
    audit.actor_user_id = principal.user_id
    audit.actor_roles = tuple(sorted(principal.roles))
    request.state.principal = principal
    return principal


def get_optional_principal(
    request: Request,
    tenant: Annotated[TenantContext, Depends(get_tenant_context)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> Principal | None:
    """Principal if a valid bearer token is present, otherwise None (used by logout)."""
    if not request.headers.get("authorization"):
        return None
    try:
        return get_current_principal(request, tenant, uow)
    except UnauthorizedError:
        return None


def require_csrf_header(request: Request) -> None:
    """CSRF defence for cookie-authenticated endpoints (refresh, logout).

    Browsers cannot attach a custom header to a cross-site request without a CORS preflight,
    which this API never grants, so requiring it blocks cross-site form/fetch attacks in
    addition to the SameSite=Strict cookie.
    """
    settings = get_settings()
    if request.headers.get(settings.csrf_header_name) != "1":
        raise ForbiddenError("Missing CSRF protection header.", code="CSRF_FAILED")


SettingsDep = Annotated[Settings, Depends(settings_dep)]
UowDep = Annotated[UnitOfWork, Depends(get_uow)]
TenantDep = Annotated[TenantContext, Depends(get_tenant_context)]
PrincipalDep = Annotated[Principal, Depends(get_current_principal)]
RedisDep = Annotated[redis.Redis, Depends(get_redis)]
