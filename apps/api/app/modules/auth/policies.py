"""Auth policies.

Authentication endpoints act only on the caller's own account, so there are no cross-user
resource rules yet. Session management of other users (FRD FR-AUTH-008 admin view) will add a
policy here.
"""

from __future__ import annotations

from app.core.deps import Principal
from app.core.permissions import Policy
from app.modules.auth.models import RefreshToken


class SessionPolicy(Policy[RefreshToken]):
    """Deny by default. A user may act on their own sessions only."""

    def in_scope(self, principal: Principal, token: RefreshToken) -> bool:
        return token.user_id == principal.user_id and token.tenant_id == principal.tenant_id
