"""Append-only audit log (FRD FR-AUD-001).

Rows are never updated or deleted by the application. The ORM refuses UPDATE/DELETE on this
model, and production grants give the application user INSERT and SELECT only (deployment phase).
Each row stores `prev_hash` and `hash` (per-tenant SHA-256 chain), so tampering is detectable.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import JSON, BigInteger, Index, String, UniqueConstraint, event
from sqlalchemy.orm import Mapped, Mapper, mapped_column

from app.db.base import Base, BinaryUUID, UTCDateTime, utcnow
from app.db.mixins import IdMixin, TenantMixin


class AppendOnlyError(RuntimeError):
    """Raised when code tries to modify or delete an audit record."""


class AuditLog(IdMixin, TenantMixin, Base):
    __tablename__ = "audit_logs"
    __table_args__ = (
        UniqueConstraint("tenant_id", "chain_seq"),
        Index("ix_audit_logs_tenant_id_occurred_at", "tenant_id", "occurred_at"),
        Index("ix_audit_logs_tenant_id_action", "tenant_id", "action"),
        Index("ix_audit_logs_tenant_id_entity", "tenant_id", "entity_type", "entity_id"),
    )

    #: Position in the tenant's hash chain (1, 2, 3, ...).
    chain_seq: Mapped[int] = mapped_column(BigInteger, nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=utcnow)
    #: Equivalent of `created_by` for this table: the acting user (None for system/anonymous).
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(BinaryUUID(), nullable=True)
    actor_roles: Mapped[str | None] = mapped_column(String(255), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    entity_id: Mapped[uuid.UUID | None] = mapped_column(BinaryUUID(), nullable=True)
    before: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    after: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(200), nullable=True)
    request_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    prev_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    hash: Mapped[str] = mapped_column(String(64), nullable=False)


def _refuse_change(mapper: Mapper[Any], connection: Any, target: AuditLog) -> None:
    raise AppendOnlyError("Audit log records are append-only")


event.listen(AuditLog, "before_update", _refuse_change)
event.listen(AuditLog, "before_delete", _refuse_change)
