"""Notifications service (skeleton).

Scope: Notification engine: templates, channels (in-app, email, SMS, WhatsApp, web push),
preferences, quiet hours, delivery tracking.
Requirements: FR-COM-003, FR-COM-004, FR-COM-007, FR-COM-008, FR-COM-009 (FRD).
"""

from __future__ import annotations

from app.core.tenancy import TenantContext
from app.db.uow import UnitOfWork


class NotificationsService:
    """Business rules for the notifications module (not implemented yet).

    Services receive a UnitOfWork and the TenantContext, authorise through the module policy,
    use tenant-scoped repositories, write audit records, and commit.
    """

    def __init__(self, uow: UnitOfWork, tenant: TenantContext) -> None:
        self.uow = uow
        self.tenant = tenant
