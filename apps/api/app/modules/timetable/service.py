"""Timetable service (skeleton).

Scope: Bell schedules, timetable builder with clash detection, publishing, substitutions (v1.1).
Requirements: FR-TT-001 to FR-TT-004 (FRD).
"""

from __future__ import annotations

from app.core.tenancy import TenantContext
from app.db.uow import UnitOfWork


class TimetableService:
    """Business rules for the timetable module (not implemented yet).

    Services receive a UnitOfWork and the TenantContext, authorise through the module policy,
    use tenant-scoped repositories, write audit records, and commit.
    """

    def __init__(self, uow: UnitOfWork, tenant: TenantContext) -> None:
        self.uow = uow
        self.tenant = tenant
