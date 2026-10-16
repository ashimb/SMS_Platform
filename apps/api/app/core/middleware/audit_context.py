"""Audit context: who is acting, from where, for the current request.

The middleware creates one mutable `AuditContext` per request and stores it in a contextvar.
The authentication dependency fills in the actor later. A mutable holder (rather than setting
the contextvar again) is required because FastAPI runs sync dependencies and endpoints in
separate worker threads, each with a copy of the context: they share the object, not later
`ContextVar.set` calls.
"""

from __future__ import annotations

from contextvars import ContextVar
from dataclasses import dataclass, field
from uuid import UUID

from starlette.types import ASGIApp, Receive, Scope, Send

from app.core.middleware.request_id import get_request_id

_MAX_USER_AGENT = 200


@dataclass(slots=True)
class AuditContext:
    ip: str | None = None
    user_agent: str | None = None
    request_id: str | None = None
    actor_user_id: UUID | None = None
    actor_roles: tuple[str, ...] = field(default_factory=tuple)


_audit_context: ContextVar[AuditContext | None] = ContextVar("audit_context", default=None)


def get_audit_context() -> AuditContext:
    """Current request's audit context (an empty one outside a request, e.g. scripts/jobs)."""
    context = _audit_context.get()
    if context is None:
        context = AuditContext()
        _audit_context.set(context)
    return context


def set_audit_context(context: AuditContext) -> None:
    _audit_context.set(context)


class AuditContextMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers") or [])
        client = scope.get("client")
        user_agent = headers.get(b"user-agent", b"").decode("latin-1")[:_MAX_USER_AGENT]
        context = AuditContext(
            # uvicorn's --proxy-headers already resolved the client address from the trusted
            # edge proxy, so scope["client"] is the real client IP.
            ip=client[0] if client else None,
            user_agent=user_agent or None,
            request_id=get_request_id(),
        )
        token = _audit_context.set(context)
        try:
            await self.app(scope, receive, send)
        finally:
            _audit_context.reset(token)
