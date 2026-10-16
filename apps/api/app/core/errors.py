"""Domain exceptions and HTTP error handlers.

Every error response uses one envelope:

    {"error": {"code": "...", "message": "...", "details": [...], "trace_id": "..."}}

Stack traces, SQL statements, and exception messages from libraries never reach clients; they
are logged server-side with the same trace id.
"""

from __future__ import annotations

from typing import Any

import structlog
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.middleware.request_id import get_request_id

logger = structlog.get_logger(__name__)


class AppError(Exception):
    """Base class for expected, client-facing errors."""

    status_code: int = 400
    code: str = "BAD_REQUEST"
    message: str = "The request could not be processed."

    def __init__(
        self,
        message: str | None = None,
        *,
        code: str | None = None,
        details: list[dict[str, Any]] | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.message = message or self.message
        self.code = code or self.code
        self.details = details or []
        self.headers = headers or {}
        super().__init__(self.message)


class ValidationFailedError(AppError):
    status_code = 422
    code = "VALIDATION_FAILED"
    message = "Some fields need attention."


class UnauthorizedError(AppError):
    status_code = 401
    code = "UNAUTHENTICATED"
    message = "Authentication is required."


class ForbiddenError(AppError):
    status_code = 403
    code = "FORBIDDEN"
    message = "You do not have permission to perform this action."


class NotFoundError(AppError):
    """Also used for out-of-scope objects, so existence is never confirmed (FRD POL-09)."""

    status_code = 404
    code = "NOT_FOUND"
    message = "The requested resource was not found."


class ConflictError(AppError):
    status_code = 409
    code = "CONFLICT"
    message = "The request conflicts with the current state of the resource."


class RateLimitedError(AppError):
    status_code = 429
    code = "RATE_LIMITED"
    message = "Too many requests. Please try again later."


class ServiceUnavailableError(AppError):
    status_code = 503
    code = "SERVICE_UNAVAILABLE"
    message = "The service is temporarily unavailable."


class TenantScopeError(RuntimeError):
    """Programming error: a tenant-owned table was queried without tenant scoping.

    Deliberately not an AppError: it is reported to clients as a generic 500.
    """


def error_body(
    code: str, message: str, details: list[dict[str, Any]] | None = None
) -> dict[str, Any]:
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details or [],
            "trace_id": get_request_id(),
        }
    }


def _response(
    status_code: int,
    code: str,
    message: str,
    details: list[dict[str, Any]] | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code, content=error_body(code, message, details), headers=headers
    )


async def _app_error_handler(request: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, AppError):
        return await _unhandled_handler(request, exc)
    if exc.status_code >= 500:
        logger.error("app_error", error_code=exc.code, path=request.url.path)
    return _response(exc.status_code, exc.code, exc.message, exc.details, exc.headers)


async def _validation_handler(request: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, RequestValidationError):
        return await _unhandled_handler(request, exc)
    # Only location, message, and type: the rejected input value is never echoed back.
    details = [
        {
            "field": ".".join(str(part) for part in err.get("loc", ()) if part != "body"),
            "code": str(err.get("type", "invalid")),
            "message": str(err.get("msg", "Invalid value.")),
        }
        for err in exc.errors()
    ]
    return _response(422, ValidationFailedError.code, ValidationFailedError.message, details)


_HTTP_CODES = {
    400: "BAD_REQUEST",
    401: "UNAUTHENTICATED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    406: "NOT_ACCEPTABLE",
    413: "PAYLOAD_TOO_LARGE",
    415: "UNSUPPORTED_MEDIA_TYPE",
    429: "RATE_LIMITED",
}


async def _http_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, StarletteHTTPException):
        return await _unhandled_handler(request, exc)
    code = _HTTP_CODES.get(exc.status_code, "HTTP_ERROR")
    message = (
        "The requested resource was not found."
        if exc.status_code == 404
        else "The request could not be processed."
    )
    headers = dict(exc.headers) if exc.headers else None
    return _response(exc.status_code, code, message, headers=headers)


async def _integrity_error_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.warning("integrity_error", path=request.url.path, error_type=type(exc).__name__)
    return _response(409, ConflictError.code, ConflictError.message)


async def _unhandled_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(
        "unhandled_exception",
        path=request.url.path,
        error_type=type(exc).__name__,
        exc_info=exc,
    )
    return _response(500, "INTERNAL_ERROR", "Something went wrong on our side.")


class UnhandledErrorMiddleware:
    """Turn unexpected exceptions into the generic 500 envelope *inside* the middleware stack.

    Starlette runs the `Exception` handler in its outermost ServerErrorMiddleware, i.e. outside
    the request-id and security-header middlewares, so those 500s would lack both. This
    middleware sits inside them. The `Exception` handler stays registered as a last resort.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        response_started = False

        async def tracking_send(message: Message) -> None:
            nonlocal response_started
            if message["type"] == "http.response.start":
                response_started = True
            await send(message)

        try:
            await self.app(scope, receive, tracking_send)
        except Exception as exc:
            if response_started:
                raise
            logger.error(
                "unhandled_exception",
                path=scope.get("path"),
                error_type=type(exc).__name__,
                exc_info=exc,
            )
            response = _response(500, "INTERNAL_ERROR", "Something went wrong on our side.")
            await response(scope, receive, send)


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, _app_error_handler)
    app.add_exception_handler(RequestValidationError, _validation_handler)
    app.add_exception_handler(StarletteHTTPException, _http_exception_handler)
    app.add_exception_handler(IntegrityError, _integrity_error_handler)
    app.add_exception_handler(SQLAlchemyError, _unhandled_handler)
    app.add_exception_handler(Exception, _unhandled_handler)
