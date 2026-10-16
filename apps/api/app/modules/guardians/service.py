"""Guardians service (skeleton).

Scope: Guardian records, student links, custody/access restrictions, invitations, contact changes.
Requirements: FR-GRD-001 to FR-GRD-005 (FRD).
"""

from __future__ import annotations

from app.core.tenancy import TenantContext
from app.db.uow import UnitOfWork


class GuardiansService:
    """Business rules for the guardians module (not implemented yet).

    Services receive a UnitOfWork and the TenantContext, authorise through the module policy,
    use tenant-scoped repositories, write audit records, and commit.
    """

    def __init__(self, uow: UnitOfWork, tenant: TenantContext) -> None:
        self.uow = uow
        self.tenant = tenant
