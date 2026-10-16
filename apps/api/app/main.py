"""FastAPI application factory.

    uvicorn app.main:app            (module-level app built from environment settings)
    create_app(settings=...)        (tests and tools)

Middleware order (outermost first): request id -> security headers -> unhandled-error
catch-all -> audit context -> CORS
(only if configured) -> routes. Docs and OpenAPI are served in non-production environments
only.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import redis
import sentry_sdk
import structlog
from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy import text

from app.core.config import Settings, get_settings
from app.core.errors import UnhandledErrorMiddleware, register_exception_handlers
from app.core.logging import configure_logging, mask_text
from app.core.middleware import (
    AuditContextMiddleware,
    RequestIDMiddleware,
    SecurityHeadersMiddleware,
)
from app.core.tenancy import build_resolver
from app.db.session import build_engine, build_session_factory
from app.modules import (
    academics,
    admissions,
    attendance,
    audit,
    auth,
    cms,
    communication,
    exams,
    fees,
    files,
    guardians,
    imports,
    notifications,
    rbac,
    reports,
    staff,
    students,
    tenants,
    timetable,
    users,
)

logger = structlog.get_logger(__name__)

_MODULE_ROUTERS: tuple[APIRouter, ...] = (
    auth.router,
    tenants.router,
    users.router,
    rbac.router,
    audit.router,
    students.router,
    notifications.router,
    files.router,
    guardians.router,
    staff.router,
    academics.router,
    timetable.router,
    attendance.router,
    exams.router,
    admissions.router,
    fees.router,
    communication.router,
    cms.router,
    reports.router,
    imports.router,
)


def _init_sentry(settings: Settings) -> None:
    if settings.sentry_dsn is None:
        return

    def scrub(event: dict[str, object], _hint: dict[str, object]) -> dict[str, object]:
        request = event.get("request")
        if isinstance(request, dict):
            request.pop("cookies", None)
            request.pop("data", None)
            headers = request.get("headers")
            if isinstance(headers, dict):
                for key in list(headers):
                    if key.lower() in {"authorization", "cookie", "x-sp-csrf"}:
                        headers[key] = "[REDACTED]"
        message = event.get("message")
        if isinstance(message, str):
            event["message"] = mask_text(message)
        return event

    sentry_sdk.init(
        dsn=settings.sentry_dsn.get_secret_value(),
        environment=settings.app_env,
        send_default_pii=False,
        traces_sample_rate=0.1,
        before_send=scrub,  # type: ignore[arg-type]
    )


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(settings.log_level, json_logs=settings.app_env != "development")
    _init_sentry(settings)

    engine = build_engine(settings)
    session_factory = build_session_factory(engine)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        app.state.redis = redis.Redis.from_url(
            settings.redis_url, socket_timeout=2, socket_connect_timeout=2, health_check_interval=30
        )
        logger.info("startup", env=settings.app_env)
        try:
            yield
        finally:
            app.state.redis.close()
            engine.dispose()

    docs_prefix = settings.api_prefix.rsplit("/", 1)[0]  # "/api"
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="SchoolPlatform API. All endpoints are tenant-scoped; see FRD §7.",
        lifespan=lifespan,
        openapi_url=f"{settings.api_prefix}/openapi.json" if settings.docs_enabled else None,
        docs_url=f"{docs_prefix}/docs" if settings.docs_enabled else None,
        redoc_url=None,
        swagger_ui_oauth2_redirect_url=None,
    )

    app.state.settings = settings
    app.state.session_factory = session_factory
    app.state.tenant_resolver = build_resolver(settings)
    app.state.principal_loader = auth.load_principal

    # Added innermost first; RequestIDMiddleware ends up outermost.
    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_credentials=True,
            allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
            allow_headers=["Authorization", "Content-Type", settings.csrf_header_name],
            max_age=600,
        )
    app.add_middleware(AuditContextMiddleware)
    app.add_middleware(UnhandledErrorMiddleware)
    app.add_middleware(
        SecurityHeadersMiddleware,
        docs_path=f"{docs_prefix}/docs" if settings.docs_enabled else None,
    )
    app.add_middleware(RequestIDMiddleware)

    register_exception_handlers(app)

    for module_router in _MODULE_ROUTERS:
        app.include_router(module_router, prefix=settings.api_prefix)

    @app.get("/health", include_in_schema=False)
    @app.get("/health/live", include_in_schema=False)
    def health() -> dict[str, str]:
        """Liveness: the process is up. No dependencies are checked."""
        return {"status": "ok"}

    @app.get("/ready", include_in_schema=False)
    def ready(request: Request) -> JSONResponse:
        """Readiness: database and Redis reachable."""
        checks: dict[str, str] = {}
        try:
            with request.app.state.session_factory() as session:
                session.execute(text("SELECT 1"))
            checks["database"] = "ok"
        except Exception:
            checks["database"] = "unavailable"
        try:
            request.app.state.redis.ping()
            checks["redis"] = "ok"
        except Exception:
            checks["redis"] = "unavailable"
        healthy = all(value == "ok" for value in checks.values())
        return JSONResponse(
            status_code=200 if healthy else 503,
            content={"status": "ok" if healthy else "unavailable", "checks": checks},
        )

    # Metrics stay on the internal network: nginx proxies only /api/ to this service.
    Instrumentator(excluded_handlers=["/health", "/health/live", "/ready", "/metrics"]).instrument(
        app
    ).expose(app, endpoint="/metrics", include_in_schema=False)

    return app


app = create_app()
