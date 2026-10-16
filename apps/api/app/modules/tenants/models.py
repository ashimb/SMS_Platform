"""Tenant (platform-wide) and TenantSettings (tenant-owned) models."""

from __future__ import annotations

from typing import Any

from sqlalchemy import JSON, CheckConstraint, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import AuditMixin, IdMixin, TenantMixin, TimestampMixin
from app.modules.tenants.constants import TENANT_STATUSES


class Tenant(IdMixin, TimestampMixin, AuditMixin, Base):
    """A school. Global table: the only model without `tenant_id`."""

    __tablename__ = "tenants"
    __table_args__ = (
        UniqueConstraint("slug"),
        CheckConstraint(
            "status IN (" + ", ".join(f"'{s}'" for s in TENANT_STATUSES) + ")", name="status"
        ),
    )

    slug: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="active")


class TenantSettings(IdMixin, TenantMixin, TimestampMixin, AuditMixin, Base):
    """Per-tenant configuration (one row per tenant)."""

    __tablename__ = "tenant_settings"
    __table_args__ = (UniqueConstraint("tenant_id"),)

    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="Asia/Kolkata")
    locale: Mapped[str] = mapped_column(String(10), nullable=False, default="en-IN")
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    academic_year_start_month: Mapped[int] = mapped_column(Integer, nullable=False, default=4)
    #: Typed settings registry (business-rule parameters, branding refs). Validated by schemas.
    settings: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
