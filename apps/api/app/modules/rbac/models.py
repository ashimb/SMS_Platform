"""RBAC models.

- `Permission`      global catalogue (codes are defined in code: `app.core.permissions.P`).
- `Role`            tenant-owned; system roles are seeded, custom roles come later (FR-IAM-002).
- `RolePermission`  tenant-owned role -> permission grants.
- `UserRole`        tenant-owned user -> role assignments.
"""

from __future__ import annotations

import uuid

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, BinaryUUID
from app.db.mixins import (
    AuditMixin,
    IdMixin,
    TenantMixin,
    TimestampMixin,
    tenant_foreign_key,
    tenant_parent_key,
)


class Permission(IdMixin, TimestampMixin, Base):
    """Platform-wide permission catalogue (not tenant-owned)."""

    __tablename__ = "permissions"
    __table_args__ = (UniqueConstraint("code"),)

    code: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)


class Role(IdMixin, TenantMixin, TimestampMixin, AuditMixin, Base):
    __tablename__ = "roles"
    __table_args__ = (UniqueConstraint("tenant_id", "code"), tenant_parent_key())

    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class RolePermission(IdMixin, TenantMixin, TimestampMixin, AuditMixin, Base):
    __tablename__ = "role_permissions"
    __table_args__ = (
        UniqueConstraint("tenant_id", "role_id", "permission_id"),
        *tenant_foreign_key("role_permissions", "role_id", "roles", ondelete="CASCADE"),
    )

    role_id: Mapped[uuid.UUID] = mapped_column(BinaryUUID(), nullable=False)
    permission_id: Mapped[uuid.UUID] = mapped_column(
        BinaryUUID(), ForeignKey("permissions.id", ondelete="RESTRICT"), nullable=False
    )


class UserRole(IdMixin, TenantMixin, TimestampMixin, AuditMixin, Base):
    __tablename__ = "user_roles"
    __table_args__ = (
        UniqueConstraint("tenant_id", "user_id", "role_id"),
        *tenant_foreign_key("user_roles", "user_id", "users", ondelete="CASCADE"),
        *tenant_foreign_key("user_roles", "role_id", "roles", ondelete="CASCADE"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(BinaryUUID(), nullable=False)
    role_id: Mapped[uuid.UUID] = mapped_column(BinaryUUID(), nullable=False)
