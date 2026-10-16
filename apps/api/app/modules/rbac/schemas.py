"""RBAC API schemas."""

from __future__ import annotations

from uuid import UUID

from app.common.schemas import OutputModel


class RoleOut(OutputModel):
    id: UUID
    code: str
    name: str
    is_system: bool
    permissions: list[str]
