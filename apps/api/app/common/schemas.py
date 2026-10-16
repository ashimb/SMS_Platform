"""Base Pydantic models and the error envelope schema (for OpenAPI)."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict


class InputModel(BaseModel):
    """Request bodies: unknown fields are rejected (so `tenant_id` can never be smuggled in)."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class OutputModel(BaseModel):
    """Response bodies built from ORM objects."""

    model_config = ConfigDict(from_attributes=True)


class ErrorDetail(BaseModel):
    field: str | None = None
    code: str
    message: str


class ErrorBody(BaseModel):
    code: str
    message: str
    details: list[ErrorDetail] = []
    trace_id: str | None = None


class ErrorEnvelope(BaseModel):
    error: ErrorBody


def error_responses(*status_codes: int) -> dict[int | str, dict[str, Any]]:
    """OpenAPI `responses=` entries documenting the error envelope."""
    descriptions = {
        400: "Bad request",
        401: "Not authenticated",
        403: "Forbidden",
        404: "Not found",
        409: "Conflict",
        422: "Validation failed",
        429: "Rate limited",
    }
    return {
        code: {"model": ErrorEnvelope, "description": descriptions.get(code, "Error")}
        for code in status_codes
    }
