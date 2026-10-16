"""Audit writer and reader.

`AuditService.record()` writes in the caller's session, so the audit row commits or rolls back
together with the change it describes (FRD FR-AUD-001 AC-1).

Hash chain: `hash = SHA-256(prev_hash || canonical JSON of the record)`, per tenant, ordered by
`chain_seq`. `verify_chain()` recomputes it.
"""

from __future__ import annotations

import hashlib
from collections.abc import Mapping
from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

import orjson
from sqlalchemy import ColumnElement
from sqlalchemy.orm import Session

from app.common.pagination import PageParams, PageResult
from app.core.deps import Principal
from app.core.errors import ForbiddenError
from app.core.middleware.audit_context import get_audit_context
from app.core.permissions import P
from app.core.tenancy import TenantContext
from app.db.base import utcnow
from app.modules.audit.constants import GENESIS_HASH, MASK, MASKED_FIELDS
from app.modules.audit.models import AuditLog
from app.modules.audit.repository import AuditLogRepository
from app.modules.audit.schemas import AuditLogOut


def _json_safe(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {
            str(k): (MASK if str(k) in MASKED_FIELDS else _json_safe(v)) for k, v in value.items()
        }
    if isinstance(value, (list, tuple, set)):
        return [_json_safe(v) for v in value]
    if isinstance(value, (UUID, Decimal)):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value


def _digest(prev_hash: str, record: AuditLog) -> str:
    canonical = orjson.dumps(
        {
            "tenant_id": str(record.tenant_id),
            "chain_seq": record.chain_seq,
            "occurred_at": record.occurred_at.isoformat(),
            "actor_user_id": str(record.actor_user_id) if record.actor_user_id else None,
            "action": record.action,
            "entity_type": record.entity_type,
            "entity_id": str(record.entity_id) if record.entity_id else None,
            "before": record.before,
            "after": record.after,
            "reason": record.reason,
            "ip": record.ip,
            "request_id": record.request_id,
        },
        option=orjson.OPT_SORT_KEYS,
    )
    return hashlib.sha256(prev_hash.encode() + canonical).hexdigest()


class AuditService:
    def __init__(self, session: Session, tenant: TenantContext) -> None:
        self.repo = AuditLogRepository(session, tenant)
        self.tenant = tenant

    def record(
        self,
        action: str,
        *,
        entity_type: str | None = None,
        entity_id: UUID | None = None,
        before: Mapping[str, Any] | None = None,
        after: Mapping[str, Any] | None = None,
        reason: str | None = None,
        actor_user_id: UUID | None = None,
    ) -> AuditLog:
        context = get_audit_context()
        head = self.repo.chain_head()
        prev_hash = head.hash if head else GENESIS_HASH
        record = AuditLog(
            chain_seq=(head.chain_seq + 1) if head else 1,
            occurred_at=utcnow(),
            actor_user_id=actor_user_id or context.actor_user_id,
            actor_roles=",".join(context.actor_roles) or None,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            before=_json_safe(before) if before is not None else None,
            after=_json_safe(after) if after is not None else None,
            reason=reason,
            ip=context.ip,
            user_agent=context.user_agent,
            request_id=context.request_id,
            prev_hash=prev_hash,
            hash="",
            tenant_id=self.tenant.tenant_id,
        )
        record.hash = _digest(prev_hash, record)
        return self.repo.add(record)

    def list_logs(
        self, principal: Principal, params: PageParams, *, action: str | None = None
    ) -> PageResult[AuditLogOut]:
        if not principal.has(P.AUDIT_READ):
            raise ForbiddenError()
        criteria: list[ColumnElement[bool]] = []
        if action:
            criteria.append(AuditLog.action == action)
        result = self.repo.paginate(params, *criteria, order_by=(AuditLog.chain_seq.desc(),))
        return result.map(AuditLogOut.model_validate)

    def verify_chain(self, *, limit: int = 100_000) -> bool:
        prev_hash = GENESIS_HASH
        expected_seq = 1
        for record in self.repo.chain(limit=limit):
            if record.chain_seq != expected_seq or record.prev_hash != prev_hash:
                return False
            if _digest(prev_hash, record) != record.hash:
                return False
            prev_hash = record.hash
            expected_seq += 1
        return True
