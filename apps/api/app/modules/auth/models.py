"""Refresh-token store.

Only the SHA-256 hash of each refresh token is stored. Tokens issued from one sign-in share a
`family_id` (the session id carried as `sid` in access tokens). Rotation marks the presented
token `used_at` and issues a child; presenting a used token again is reuse, and revokes the whole
family (FRD FR-SEC-005).
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, BinaryUUID, UTCDateTime
from app.db.mixins import IdMixin, TenantMixin, TimestampMixin, tenant_foreign_key


class RefreshToken(IdMixin, TenantMixin, TimestampMixin, Base):
    __tablename__ = "refresh_tokens"
    __table_args__ = (
        UniqueConstraint("token_hash"),
        Index("ix_refresh_tokens_tenant_id_family_id", "tenant_id", "family_id"),
        *tenant_foreign_key("refresh_tokens", "user_id", "users", ondelete="CASCADE"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(BinaryUUID(), nullable=False)
    family_id: Mapped[uuid.UUID] = mapped_column(BinaryUUID(), nullable=False)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(BinaryUUID(), nullable=True)
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    revoked_reason: Mapped[str | None] = mapped_column(String(32), nullable=True)
    ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(200), nullable=True)
