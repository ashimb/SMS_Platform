"""Academics service (skeleton).

Scope: Academic years and terms, calendar, classes/sections/streams, subjects, rollover, homework.
Requirements: FR-ACA-001 to FR-ACA-006 (FRD).
"""

from __future__ import annotations

from app.core.tenancy import TenantContext
from app.db.uow import UnitOfWork


class AcademicsService:
    """Business rules for the academics module (not implemented yet).

    Services receive a UnitOfWork and the TenantContext, authorise through the module policy,
    use tenant-scoped repositories, write audit records, and commit.
    """

    def __init__(self, uow: UnitOfWork, tenant: TenantContext) -> None:
        self.uow = uow
        self.tenant = tenant
