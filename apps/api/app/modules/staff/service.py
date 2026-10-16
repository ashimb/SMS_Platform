"""Staff service (skeleton).

Scope: Staff records, teaching assignments, exit/offboarding, leave and attendance (v1.1).
Requirements: FR-STF-001 to FR-STF-005 (FRD).
"""

from __future__ import annotations

from app.core.tenancy import TenantContext
from app.db.uow import UnitOfWork


class StaffService:
    """Business rules for the staff module (not implemented yet).

    Services receive a UnitOfWork and the TenantContext, authorise through the module policy,
    use tenant-scoped repositories, write audit records, and commit.
    """

    def __init__(self, uow: UnitOfWork, tenant: TenantContext) -> None:
        self.uow = uow
        self.tenant = tenant
