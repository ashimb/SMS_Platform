"""Tenants service."""

from __future__ import annotations

from uuid import UUID

from app.core.errors import ConflictError, NotFoundError
from app.core.tenancy import TenantContext
from app.db.uow import UnitOfWork
from app.modules.tenants.models import Tenant, TenantSettings
from app.modules.tenants.repository import TenantRecordRepository, TenantSettingsRepository
from app.modules.tenants.schemas import TenantPublicOut, TenantSettingsOut


class TenantService:
    def __init__(self, uow: UnitOfWork) -> None:
        self.uow = uow
        self.tenants = TenantRecordRepository(uow.session)

    def get_public_profile(self, tenant: TenantContext) -> TenantPublicOut:
        record = self.tenants.get(tenant.tenant_id)
        if record is None or record.status != "active":
            raise NotFoundError()
        return TenantPublicOut.model_validate(record)

    def get_settings(self, tenant: TenantContext) -> TenantSettingsOut:
        settings = TenantSettingsRepository(self.uow.session, tenant).get_current()
        if settings is None:
            raise NotFoundError()
        return TenantSettingsOut.model_validate(settings)

    def create_tenant(
        self, *, slug: str, name: str, tenant_id: UUID | None = None
    ) -> TenantContext:
        """Create a tenant and its settings row. Caller commits."""
        if self.tenants.get_by_slug(slug) is not None:
            raise ConflictError("A tenant with this slug already exists.", code="TENANT_EXISTS")
        record = Tenant(slug=slug, name=name, status="active")
        if tenant_id is not None:
            record.id = tenant_id
        self.tenants.add(record)
        context = TenantContext(tenant_id=record.id, slug=record.slug)
        TenantSettingsRepository(self.uow.session, context).add(TenantSettings())
        return context

    def find_context(self, slug: str) -> TenantContext | None:
        record = self.tenants.get_by_slug(slug)
        return TenantContext(tenant_id=record.id, slug=record.slug) if record else None
