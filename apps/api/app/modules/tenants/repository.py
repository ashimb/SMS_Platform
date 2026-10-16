"""Tenants repositories."""

from __future__ import annotations

from sqlalchemy import select

from app.common.repository import GlobalRepository, TenantRepository
from app.modules.tenants.models import Tenant, TenantSettings


class TenantRecordRepository(GlobalRepository[Tenant]):
    """Platform-wide tenant records."""

    model = Tenant

    def get_by_slug(self, slug: str) -> Tenant | None:
        return self.session.execute(select(Tenant).where(Tenant.slug == slug)).scalar_one_or_none()


class TenantSettingsRepository(TenantRepository[TenantSettings]):
    model = TenantSettings

    def get_current(self) -> TenantSettings | None:
        return self.session.execute(self.select()).scalar_one_or_none()
