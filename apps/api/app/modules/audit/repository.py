"""Audit repository: inserts and reads only."""

from __future__ import annotations

from typing import Any, NoReturn

from sqlalchemy import select

from app.common.repository import TenantRepository
from app.modules.audit.models import AppendOnlyError, AuditLog


class AuditLogRepository(TenantRepository[AuditLog]):
    model = AuditLog

    def chain_head(self) -> AuditLog | None:
        """Latest record of this tenant's chain, locked so concurrent writers serialise."""
        stmt = self.scope(
            select(AuditLog).order_by(AuditLog.chain_seq.desc()).limit(1).with_for_update()
        )
        return self.session.execute(stmt).scalar_one_or_none()

    def chain(self, *, limit: int = 1000) -> list[AuditLog]:
        return self.list(order_by=(AuditLog.chain_seq,), limit=limit)

    # Mutations are not available for audit records.
    def update(self, entity: AuditLog, values: Any) -> NoReturn:
        raise AppendOnlyError("Audit log records are append-only")

    def update_where(self, values: Any, *criteria: Any) -> NoReturn:
        raise AppendOnlyError("Audit log records are append-only")

    def delete_where(self, *criteria: Any) -> NoReturn:
        raise AppendOnlyError("Audit log records are append-only")

    def soft_delete(self, entity: AuditLog) -> NoReturn:
        raise AppendOnlyError("Audit log records are append-only")
