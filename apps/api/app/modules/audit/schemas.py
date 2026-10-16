"""Audit API schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from app.common.schemas import OutputModel


class AuditLogOut(OutputModel):
    id: UUID
    chain_seq: int
    occurred_at: datetime
    actor_user_id: UUID | None
    actor_roles: str | None
    action: str
    entity_type: str | None
    entity_id: UUID | None
    before: dict[str, Any] | None
    after: dict[str, Any] | None
    reason: str | None
    request_id: str | None
