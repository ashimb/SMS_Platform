"""User account model (staff, parents, students share this table; roles differ)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, Boolean, CheckConstraint, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UTCDateTime
from app.db.mixins import (
    AuditMixin,
    IdMixin,
    SoftDeleteMixin,
    TenantMixin,
    TimestampMixin,
    tenant_parent_key,
)
from app.modules.users.constants import USER_STATUSES


class User(IdMixin, TenantMixin, TimestampMixin, AuditMixin, SoftDeleteMixin, Base):
    __tablename__ = "users"
    __table_args__ = (
        # Email is unique per tenant, not globally (the same parent may use two schools).
        UniqueConstraint("tenant_id", "email"),
        tenant_parent_key(),
        CheckConstraint(
            "status IN (" + ", ".join(f"'{s}'" for s in USER_STATUSES) + ")", name="status"
        ),
        CheckConstraint("failed_login_count >= 0", name="failed_login_count_non_negative"),
    )

    email: Mapped[str] = mapped_column(String(254), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    #: Argon2id hash. Nullable for OTP-only accounts (parents), which arrive in a later phase.
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="active")

    # ---- MFA (TOTP). Secrets are Fernet-encrypted; never returned by any API.
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    mfa_secret_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    mfa_pending_secret_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    mfa_last_used_step: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

    # ---- Login protection
    failed_login_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    last_login_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    password_changed_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)

    @property
    def is_active(self) -> bool:
        return self.status == "active" and self.deleted_at is None
