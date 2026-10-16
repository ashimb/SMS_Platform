"""Tenant resolution.

The tenant is resolved **once per request** by `get_tenant_context` and is immutable afterwards.
It is never taken from client-controlled input (body, query, or custom headers).

v1 (single tenant): `DefaultTenantResolver` always returns the configured default tenant.

Extension point (multi-tenant): `HostTenantResolver` maps the request host (portal/website
subdomain or custom domain) to a tenant. Select it with `TENANT_RESOLUTION=host` and install a
host map loaded from the `tenant_domains` table (v2). The authenticated JWT's `tid` must always
equal the resolved tenant; `core.deps.get_current_principal` enforces that.
"""

from __future__ import annotations

from collections.abc import Mapping
from contextvars import ContextVar
from dataclasses import dataclass
from typing import Protocol
from uuid import UUID

from fastapi import Request

from app.core.config import Settings, get_settings
from app.core.errors import NotFoundError


@dataclass(frozen=True, slots=True)
class TenantContext:
    """The tenant a request (or background job) runs for."""

    tenant_id: UUID
    slug: str

    def cache_key(self, *parts: str) -> str:
        """Tenant-prefixed Redis key: `t:{tenant_id}:part1:part2`."""
        return ":".join(("t", str(self.tenant_id), *parts))

    def storage_key(self, *parts: str) -> str:
        """Tenant-prefixed object-storage key: `t/{tenant_id}/part1/part2`."""
        return "/".join(("t", str(self.tenant_id), *parts))


class TenantResolver(Protocol):
    """Strategy that maps a request to a tenant."""

    def resolve(self, request: Request) -> TenantContext: ...


class DefaultTenantResolver:
    """v1: every request belongs to the configured default tenant."""

    def __init__(self, settings: Settings) -> None:
        self._context = TenantContext(
            tenant_id=settings.default_tenant_id, slug=settings.default_tenant_slug
        )

    def resolve(self, request: Request) -> TenantContext:
        return self._context


class HostTenantResolver:
    """Resolves the tenant from the request host (exact, case-insensitive, port stripped).

    The host comes from the `Host` header as seen by the API behind the trusted edge proxy.
    Unknown hosts are rejected with 404, never mapped to a default.
    """

    def __init__(self, host_map: Mapping[str, TenantContext]) -> None:
        self._host_map = {host.lower(): ctx for host, ctx in host_map.items()}

    def resolve(self, request: Request) -> TenantContext:
        host = (request.headers.get("host") or "").split(":", 1)[0].strip().lower()
        context = self._host_map.get(host)
        if context is None:
            raise NotFoundError("Unknown host.", code="UNKNOWN_HOST")
        return context


def build_resolver(settings: Settings) -> TenantResolver:
    """Resolver for the configured strategy. Host maps are installed by the app factory."""
    if settings.tenant_resolution == "default":
        return DefaultTenantResolver(settings)
    # v2: load the map from tenant_domains. Until then an empty map rejects every host.
    return HostTenantResolver({})


_current_tenant: ContextVar[TenantContext | None] = ContextVar("current_tenant", default=None)


def get_tenant_context(request: Request) -> TenantContext:
    """FastAPI dependency: resolve the tenant once per request and cache it on the request."""
    cached = getattr(request.state, "tenant", None)
    if isinstance(cached, TenantContext):
        return cached
    resolver: TenantResolver = getattr(
        request.app.state, "tenant_resolver", None
    ) or DefaultTenantResolver(get_settings())
    context = resolver.resolve(request)
    request.state.tenant = context
    _current_tenant.set(context)
    return context


def current_tenant() -> TenantContext | None:
    """Tenant of the running request/job, for logging. Business code receives it explicitly."""
    return _current_tenant.get()


def set_current_tenant(context: TenantContext | None) -> None:
    """Used by the worker to restore tenant context from a job payload."""
    _current_tenant.set(context)
