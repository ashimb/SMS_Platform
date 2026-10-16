"""Users repository."""

from __future__ import annotations

from app.common.repository import TenantRepository
from app.modules.users.models import User


class UserRepository(TenantRepository[User]):
    model = User

    def get_by_email(self, email: str) -> User | None:
        stmt = self.select().where(User.email == email)
        return self.session.execute(stmt).scalar_one_or_none()
