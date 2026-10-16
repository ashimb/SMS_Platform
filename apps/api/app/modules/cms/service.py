"""CMS service (skeleton).

Scope: Website pages and blocks, content types, menus, SEO, publishing workflow, media consent
gating.
Requirements: FR-CMS-001 to FR-CMS-011, FR-MED-003, FR-MED-004 (FRD).
"""

from __future__ import annotations

from app.core.tenancy import TenantContext
from app.db.uow import UnitOfWork


class CmsService:
    """Business rules for the cms module (not implemented yet).

    Services receive a UnitOfWork and the TenantContext, authorise through the module policy,
    use tenant-scoped repositories, write audit records, and commit.
    """

    def __init__(self, uow: UnitOfWork, tenant: TenantContext) -> None:
        self.uow = uow
        self.tenant = tenant
