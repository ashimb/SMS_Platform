"""Attendance service (skeleton).

Scope: Daily/period attendance, offline sync, absence alerts, leave requests, edits, thresholds.
Requirements: FR-ATT-001 to FR-ATT-007 (FRD).
"""

from __future__ import annotations

from app.core.tenancy import TenantContext
from app.db.uow import UnitOfWork


class AttendanceService:
    """Business rules for the attendance module (not implemented yet).

    Services receive a UnitOfWork and the TenantContext, authorise through the module policy,
    use tenant-scoped repositories, write audit records, and commit.
    """

    def __init__(self, uow: UnitOfWork, tenant: TenantContext) -> None:
        self.uow = uow
        self.tenant = tenant
