"""Refresh-token repository."""

from __future__ import annotations

from uuid import UUID

from app.common.repository import TenantRepository
from app.db.base import utcnow
from app.modules.auth.models import RefreshToken


class RefreshTokenRepository(TenantRepository[RefreshToken]):
    model = RefreshToken

    def get_by_hash(self, token_hash: str) -> RefreshToken | None:
        stmt = self.select().where(RefreshToken.token_hash == token_hash).with_for_update()
        return self.session.execute(stmt).scalar_one_or_none()

    def revoke_family(self, family_id: UUID, reason: str) -> int:
        return self.update_where(
            {"revoked_at": utcnow(), "revoked_reason": reason},
            RefreshToken.family_id == family_id,
            RefreshToken.revoked_at.is_(None),
        )
