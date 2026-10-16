"""Audit log HTTP routes (read-only)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.common.pagination import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, Page, PageParams
from app.common.schemas import error_responses
from app.core.deps import Principal, TenantDep, UowDep
from app.core.permissions import P, require_permission
from app.core.rate_limit import default_limiter
from app.modules.audit.schemas import AuditLogOut
from app.modules.audit.service import AuditService

router = APIRouter(prefix="/audit-logs", tags=["audit"], dependencies=[Depends(default_limiter())])


@router.get("", response_model=Page[AuditLogOut], responses=error_responses(401, 403))
def list_audit_logs(
    uow: UowDep,
    tenant: TenantDep,
    principal: Annotated[Principal, Depends(require_permission(P.AUDIT_READ))],
    action: Annotated[str | None, Query(max_length=100)] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=MAX_PAGE_SIZE)] = DEFAULT_PAGE_SIZE,
) -> Page[AuditLogOut]:
    service = AuditService(uow.session, tenant)
    result = service.list_logs(principal, PageParams(page, page_size), action=action)
    # Viewing the audit log is itself audited (FRD FR-AUD-002).
    service.record("audit.log.viewed", after={"action_filter": action, "page": page})
    uow.commit()
    return Page.from_result(result)
