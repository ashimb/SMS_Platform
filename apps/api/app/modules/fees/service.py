"""Fees service (skeleton).

Scope: Fee heads/structures, concessions, invoices, online/counter payments, receipts, refunds,
ledger, reconciliation.
Requirements: FR-FIN-001 to FR-FIN-018 (FRD).
"""

from __future__ import annotations

from app.core.tenancy import TenantContext
from app.db.uow import UnitOfWork


class FeesService:
    """Business rules for the fees module (not implemented yet).

    Services receive a UnitOfWork and the TenantContext, authorise through the module policy,
    use tenant-scoped repositories, write audit records, and commit.
    """

    def __init__(self, uow: UnitOfWork, tenant: TenantContext) -> None:
        self.uow = uow
        self.tenant = tenant
