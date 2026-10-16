"""Worker: tenant context travels in every job payload and is required (fail closed)."""

from __future__ import annotations

import asyncio
from typing import Any
from uuid import uuid4

import pytest

from app.core.tenancy import TenantContext, current_tenant
from app.worker.tasks import MissingTenantContextError, enqueue_tenant_job, tenant_task
from app.worker.tasks.maintenance import ping

pytestmark = pytest.mark.unit


def test_tenant_task_restores_context_and_clears_it() -> None:
    tenant_id = uuid4()
    seen: dict[str, Any] = {}

    @tenant_task
    async def job(ctx: dict[str, Any], tenant: TenantContext, value: int) -> int:
        seen["tenant"] = tenant
        seen["current"] = current_tenant()
        return value * 2

    result = asyncio.run(job({}, tenant_id=str(tenant_id), tenant_slug="default", value=21))
    assert result == 42
    assert seen["tenant"] == TenantContext(tenant_id=tenant_id, slug="default")
    assert seen["current"] == seen["tenant"]
    assert current_tenant() is None


@pytest.mark.parametrize("kwargs", [{}, {"tenant_id": str(uuid4())}, {"tenant_slug": "default"}])
def test_tenant_task_without_context_is_rejected(kwargs: dict[str, str]) -> None:
    with pytest.raises(MissingTenantContextError):
        asyncio.run(ping({}, **kwargs))


def test_ping_returns_tenant_id() -> None:
    tenant_id = uuid4()
    assert asyncio.run(ping({}, tenant_id=str(tenant_id), tenant_slug="x")) == str(tenant_id)


def test_enqueue_adds_tenant_context() -> None:
    calls: list[tuple[str, dict[str, Any]]] = []

    class FakeRedis:
        async def enqueue_job(self, function: str, **kwargs: Any) -> None:
            calls.append((function, kwargs))

    tenant = TenantContext(tenant_id=uuid4(), slug="default")
    asyncio.run(enqueue_tenant_job(FakeRedis(), tenant, "ping", extra=1))  # type: ignore[arg-type]
    assert calls == [
        ("ping", {"tenant_id": str(tenant.tenant_id), "tenant_slug": "default", "extra": 1})
    ]


def test_worker_settings_registered() -> None:
    from app.worker import WorkerSettings

    assert ping in WorkerSettings.functions
    assert WorkerSettings.redis_settings is not None


def test_tenant_context_keys_are_prefixed() -> None:
    tenant = TenantContext(tenant_id=uuid4(), slug="default")
    assert tenant.cache_key("rl", "login") == f"t:{tenant.tenant_id}:rl:login"
    assert tenant.storage_key("students", "a.jpg") == f"t/{tenant.tenant_id}/students/a.jpg"
