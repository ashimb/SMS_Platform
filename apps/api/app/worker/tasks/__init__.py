"""Worker task registry and tenant-safety helpers."""

from __future__ import annotations

import functools
from collections.abc import Awaitable, Callable
from typing import Any
from uuid import UUID

from arq.connections import ArqRedis
from arq.jobs import Job

from app.core.tenancy import TenantContext, set_current_tenant

TaskFunc = Callable[..., Awaitable[Any]]


class MissingTenantContextError(RuntimeError):
    """A tenant task was enqueued without tenant context."""


def tenant_task(func: Callable[..., Awaitable[Any]]) -> TaskFunc:
    """Decorator: rebuild TenantContext from job kwargs; refuse jobs without it."""

    @functools.wraps(func)
    async def wrapper(ctx: dict[str, Any], *args: Any, **kwargs: Any) -> Any:
        tenant_id = kwargs.pop("tenant_id", None)
        tenant_slug = kwargs.pop("tenant_slug", None)
        if not tenant_id or not tenant_slug:
            raise MissingTenantContextError(f"job {func.__name__} has no tenant context")
        tenant = TenantContext(tenant_id=UUID(str(tenant_id)), slug=str(tenant_slug))
        set_current_tenant(tenant)
        try:
            return await func(ctx, tenant, *args, **kwargs)
        finally:
            set_current_tenant(None)

    return wrapper


async def enqueue_tenant_job(
    redis: ArqRedis, tenant: TenantContext, function: str, /, **kwargs: Any
) -> Job | None:
    """Enqueue a job carrying the tenant context (never derived from client input)."""
    return await redis.enqueue_job(
        function, tenant_id=str(tenant.tenant_id), tenant_slug=tenant.slug, **kwargs
    )


from app.worker.tasks.maintenance import ping  # noqa: E402  (registry after helpers)

FUNCTIONS: tuple[TaskFunc, ...] = (ping,)

__all__ = ["FUNCTIONS", "MissingTenantContextError", "enqueue_tenant_job", "tenant_task"]
