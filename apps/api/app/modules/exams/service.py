"""Exams service (skeleton).

Scope: Assessment structures, grading schemes, marks entry, approval workflow, report cards,
publication.
Requirements: FR-EXM-001 to FR-EXM-010 (FRD).
"""

from __future__ import annotations

from app.core.tenancy import TenantContext
from app.db.uow import UnitOfWork


class ExamsService:
    """Business rules for the exams module (not implemented yet).

    Services receive a UnitOfWork and the TenantContext, authorise through the module policy,
    use tenant-scoped repositories, write audit records, and commit.
    """

    def __init__(self, uow: UnitOfWork, tenant: TenantContext) -> None:
        self.uow = uow
        self.tenant = tenant
