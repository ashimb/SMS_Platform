"""Maintenance tasks."""

from __future__ import annotations

from typing import Any

import structlog

from app.core.tenancy import TenantContext
from app.worker.tasks import tenant_task

logger = structlog.get_logger(__name__)


@tenant_task
async def ping(ctx: dict[str, Any], tenant: TenantContext) -> str:
    """Round-trip check that a tenant-scoped job runs with its context restored."""
    logger.info("worker.ping")
    return str(tenant.tenant_id)
