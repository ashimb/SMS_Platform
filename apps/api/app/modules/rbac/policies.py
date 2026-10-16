"""RBAC policies: no self-elevation (FRD POL-08), maker-checker arrives with custom roles."""

from __future__ import annotations

from app.core.deps import Principal
from app.core.permissions import P, Policy
from app.modules.rbac.models import UserRole


class RoleAssignmentPolicy(Policy[UserRole]):
    required_permissions = {"assign": P.ROLES_ASSIGN}

    def rule_assign(self, principal: Principal, assignment: UserRole | None) -> bool:
        # Users can never assign roles to themselves.
        return assignment is not None and assignment.user_id != principal.user_id
