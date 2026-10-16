"""Users policies (deny by default)."""

from __future__ import annotations

from app.core.deps import Principal
from app.core.permissions import P, Policy
from app.modules.users.models import User


class UserPolicy(Policy[User]):
    required_permissions = {
        "view": P.USERS_READ,
        "update": P.USERS_UPDATE,
    }

    def rule_view(self, principal: Principal, user: User | None) -> bool:
        return user is None or user.tenant_id == principal.tenant_id

    def rule_update(self, principal: Principal, user: User | None) -> bool:
        return user is not None and user.tenant_id == principal.tenant_id

    def in_scope(self, principal: Principal, user: User) -> bool:
        return principal.has(P.USERS_READ) and user.tenant_id == principal.tenant_id
