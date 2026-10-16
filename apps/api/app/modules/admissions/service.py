"""Admissions service (skeleton).

Scope: Enquiries, pipeline, admission cycles and forms, applications, decisions, enrolment
conversion.
Requirements: FR-ADM-001 to FR-ADM-011 (FRD).
"""

from __future__ import annotations

from app.core.tenancy import TenantContext
from app.db.uow import UnitOfWork


class AdmissionsService:
    """Business rules for the admissions module (not implemented yet).

    Services receive a UnitOfWork and the TenantContext, authorise through the module policy,
    use tenant-scoped repositories, write audit records, and commit.
    """

    def __init__(self, uow: UnitOfWork, tenant: TenantContext) -> None:
        self.uow = uow
        self.tenant = tenant
