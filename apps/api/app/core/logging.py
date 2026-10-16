"""Structured JSON logging with PII masking (FRD FR-SEC-031).

- structlog renders one JSON object per line (orjson serializer) with timestamp, level,
  request_id, and tenant_id.
- `mask_pii` runs on every event, including events from standard-library loggers (uvicorn,
  SQLAlchemy). It redacts sensitive keys and masks emails, Indian/E.164 phone numbers, JWTs,
  bearer tokens, and Aadhaar-like 12-digit numbers inside any string value.
"""

from __future__ import annotations

import logging
import re
import sys
from collections.abc import Mapping, MutableMapping
from typing import Any

import orjson
import structlog
from structlog.types import EventDict, Processor, WrappedLogger

from app.core.middleware.request_id import get_request_id
from app.core.tenancy import current_tenant

REDACTED = "[REDACTED]"

_SENSITIVE_KEYS = frozenset(
    {
        "password",
        "new_password",
        "current_password",
        "password_hash",
        "token",
        "access_token",
        "refresh_token",
        "mfa_token",
        "secret",
        "client_secret",
        "authorization",
        "cookie",
        "set-cookie",
        "otp",
        "code",
        "totp",
        "api_key",
        "aadhaar",
        "aadhaar_no",
    }
)

_EMAIL = re.compile(
    r"\b([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-])[A-Za-z0-9.-]*\.([A-Za-z]{2,})\b"
)
_JWT = re.compile(r"\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b")
_BEARER = re.compile(r"(?i)\bbearer\s+[A-Za-z0-9._~+/=-]+")
_PHONE = re.compile(r"(?<![\w])(?:\+?91[\s-]?)?([6-9]\d{4})[\s-]?(\d{5})(?![\w])")
_INTL_PHONE = re.compile(r"(?<![\w])\+(?!91)\d{1,3}[\s-]?\d{4,12}(?![\w])")
_AADHAAR = re.compile(r"(?<!\d)\d{4}[\s-]?\d{4}[\s-]?(\d{4})(?!\d)")


def mask_text(value: str) -> str:
    """Mask PII patterns inside free text."""
    value = _JWT.sub("[JWT]", value)
    value = _BEARER.sub("Bearer [REDACTED]", value)
    value = _EMAIL.sub(lambda m: f"{m.group(1)}***@{m.group(2)}***.{m.group(3)}", value)
    value = _AADHAAR.sub(lambda m: f"XXXX-XXXX-{m.group(1)}", value)
    value = _PHONE.sub(lambda m: f"+91*****{m.group(2)}", value)
    return _INTL_PHONE.sub("+[PHONE]", value)


def _mask_value(key: str | None, value: Any) -> Any:
    if key is not None and key.lower() in _SENSITIVE_KEYS:
        return REDACTED
    if isinstance(value, str):
        return mask_text(value)
    if isinstance(value, Mapping):
        return {k: _mask_value(str(k), v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_mask_value(None, v) for v in value]
    return value


def mask_pii(_: WrappedLogger, __: str, event_dict: EventDict) -> EventDict:
    """structlog processor: redact sensitive keys and mask PII in all values."""
    for key in list(event_dict.keys()):
        event_dict[key] = _mask_value(key, event_dict[key])
    return event_dict


def _add_context(_: WrappedLogger, __: str, event_dict: EventDict) -> EventDict:
    request_id = get_request_id()
    if request_id:
        event_dict.setdefault("request_id", request_id)
    tenant = current_tenant()
    if tenant is not None:
        event_dict.setdefault("tenant_id", str(tenant.tenant_id))
    return event_dict


def _orjson_dumps(obj: MutableMapping[str, Any], **_: Any) -> str:
    return orjson.dumps(obj, default=str).decode()


def configure_logging(level: str = "info", *, json_logs: bool = True) -> None:
    """Configure structlog and route standard-library logging through the same pipeline."""
    shared: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        _add_context,
        structlog.processors.format_exc_info,
        mask_pii,
    ]
    renderer: Processor = (
        structlog.processors.JSONRenderer(serializer=_orjson_dumps)
        if json_logs
        else structlog.dev.ConsoleRenderer(colors=False)
    )

    structlog.configure(
        processors=[*shared, structlog.stdlib.ProcessorFormatter.wrap_for_formatter],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=shared,
        processors=[structlog.stdlib.ProcessorFormatter.remove_processors_meta, renderer],
    )
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers[:] = [handler]
    root.setLevel(level.upper())
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access", "arq"):
        lib_logger = logging.getLogger(name)
        lib_logger.handlers[:] = []
        lib_logger.propagate = True
    # SQL parameters can contain PII; never log statements below WARNING.
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
