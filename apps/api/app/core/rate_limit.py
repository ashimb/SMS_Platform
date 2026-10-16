"""Redis-backed rate limiting as FastAPI dependencies (FRD FR-SEC-022).

Why a small custom limiter instead of slowapi:
- It is a plain dependency, so limits are declared per route next to the permission check and are
  visible in code review (slowapi uses decorators plus app-global state and needs the `request`
  argument on every endpoint).
- Keys are tenant-prefixed (`t:{tenant_id}:rl:...`) as the tenancy rules require.
- Failure behaviour is explicit per limiter: authentication limiters fail closed (503) if Redis is
  unavailable; general limiters fail open and log.
- It is fully typed (mypy strict) and returns the standard error envelope with `Retry-After`.

Algorithm: fixed window counter (`INCR` + `EXPIRE` in one MULTI transaction).
"""

from __future__ import annotations

import time
from collections.abc import Callable
from typing import Annotated

import redis
import structlog
from fastapi import Depends, Request, Response

from app.core.config import get_settings
from app.core.errors import RateLimitedError, ServiceUnavailableError
from app.core.tenancy import TenantContext, get_tenant_context

logger = structlog.get_logger(__name__)

KeyFunc = Callable[[Request], str]


def client_ip(request: Request) -> str:
    """Client address as resolved by uvicorn's trusted proxy-header handling."""
    return request.client.host if request.client else "unknown"


class RateLimiter:
    """Dependency enforcing `limit` requests per `window_seconds` per key."""

    def __init__(
        self,
        name: str,
        *,
        limit: int,
        window_seconds: int,
        key_func: KeyFunc = client_ip,
        fail_closed: bool = False,
    ) -> None:
        if limit < 1 or window_seconds < 1:
            raise ValueError("limit and window_seconds must be positive")
        self.name = name
        self.limit = limit
        self.window_seconds = window_seconds
        self.key_func = key_func
        self.fail_closed = fail_closed

    def __call__(
        self,
        request: Request,
        response: Response,
        tenant: Annotated[TenantContext, Depends(get_tenant_context)],
    ) -> None:
        if not get_settings().rate_limit_enabled:
            return

        client: redis.Redis | None = getattr(request.app.state, "redis", None)
        now = int(time.time())
        window = now // self.window_seconds
        key = tenant.cache_key("rl", self.name, self.key_func(request), str(window))

        try:
            if client is None:
                raise redis.ConnectionError("redis client not configured")
            pipe = client.pipeline(transaction=True)
            pipe.incr(key)
            pipe.expire(key, self.window_seconds + 1)
            count = int(pipe.execute()[0])
        except redis.RedisError:
            logger.warning("rate_limit_backend_unavailable", limiter=self.name)
            if self.fail_closed:
                raise ServiceUnavailableError() from None
            return

        retry_after = max(1, (window + 1) * self.window_seconds - now)
        remaining = max(0, self.limit - count)
        response.headers["RateLimit-Limit"] = str(self.limit)
        response.headers["RateLimit-Remaining"] = str(remaining)
        response.headers["RateLimit-Reset"] = str(retry_after)

        if count > self.limit:
            logger.warning("rate_limited", limiter=self.name, path=request.url.path)
            raise RateLimitedError(
                headers={
                    "Retry-After": str(retry_after),
                    "RateLimit-Limit": str(self.limit),
                    "RateLimit-Remaining": "0",
                    "RateLimit-Reset": str(retry_after),
                }
            )


def default_limiter() -> RateLimiter:
    settings = get_settings()
    return RateLimiter(
        "api",
        limit=settings.rate_limit_default,
        window_seconds=settings.rate_limit_default_window_seconds,
    )


def auth_limiter(name: str = "auth") -> RateLimiter:
    """Stricter limiter for login, refresh, and MFA endpoints. Fails closed."""
    settings = get_settings()
    return RateLimiter(
        name,
        limit=settings.rate_limit_auth,
        window_seconds=settings.rate_limit_auth_window_seconds,
        fail_closed=True,
    )
