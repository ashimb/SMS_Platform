"""Reports service (skeleton).

Scope: Role dashboards, standard report catalogue, permission-scoped exports.
Requirements: FR-RPT-001 to FR-RPT-005 (FRD).
"""

from __future__ import annotations

from app.core.tenancy import TenantContext
from app.db.uow import UnitOfWork


class ReportsService:
    """Business rules for the reports module (not implemented yet).

    Services receive a UnitOfWork and the TenantContext, authorise through the module policy,
    use tenant-scoped repositories, write audit records, and commit.
    """

    def __init__(self, uow: UnitOfWork, tenant: TenantContext) -> None:
        self.uow = uow
        self.tenant = tenant
