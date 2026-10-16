"""ARQ worker settings.

    arq app.worker.WorkerSettings

Every job is tenant-scoped: `enqueue_tenant_job` puts `tenant_id` and `tenant_slug` in the job
kwargs, and `@tenant_task` restores the TenantContext before the job body runs and rejects jobs
without it (fail closed, FRD FR-SEC-014).
"""

from __future__ import annotations

from typing import Any, ClassVar

from arq.connections import RedisSettings

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.worker.tasks import FUNCTIONS


def redis_settings() -> RedisSettings:
    settings = get_settings()
    return RedisSettings(
        host=settings.redis_host,
        port=settings.redis_port,
        database=settings.redis_db,
        password=settings.redis_password.get_secret_value() or None,
        conn_timeout=5,
    )


async def startup(ctx: dict[str, Any]) -> None:
    settings = get_settings()
    configure_logging(settings.log_level, json_logs=settings.app_env != "development")
    ctx["settings"] = settings


async def shutdown(ctx: dict[str, Any]) -> None:
    return None


class WorkerSettings:
    functions: ClassVar[list[Any]] = list(FUNCTIONS)
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = redis_settings()
    max_jobs = 10
    job_timeout = 300
    keep_result = 3600
    health_check_interval = 30
