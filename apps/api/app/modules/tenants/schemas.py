"""Tenants API schemas."""

from __future__ import annotations

from uuid import UUID

from app.common.schemas import OutputModel


class TenantPublicOut(OutputModel):
    """Public (C1) school identity, available before sign-in for branding."""

    slug: str
    name: str


class TenantSettingsOut(OutputModel):
    tenant_id: UUID
    timezone: str
    locale: str
    currency: str
    academic_year_start_month: int
