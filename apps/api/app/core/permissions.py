"""Permissions, `require_permission`, and the policy base class (deny by default).

- **Route level:** `Depends(require_permission(P.STUDENTS_READ))` rejects with 403 unless the
  principal holds *every* listed permission in the current tenant.
- **Resource level:** each module's `policies.py` subclasses `Policy`. Unknown actions and missing
  rules are denied. Resources outside the principal's scope raise `NotFoundError` (404), so their
  existence is not revealed (FRD POL-09).
"""

from __future__ import annotations

from collections.abc import Callable, Mapping
from typing import Annotated, ClassVar, Final, final

from fastapi import Depends

from app.core.deps import Principal, get_current_principal
from app.core.errors import ForbiddenError, NotFoundError


class P:
    """Permission catalogue (`<module>.<resource>.<action>`). Seeded into `permissions`."""

    TENANT_READ: Final = "tenants.profile.read"
    TENANT_UPDATE: Final = "tenants.profile.update"

    USERS_READ: Final = "users.account.read"
    USERS_CREATE: Final = "users.account.create"
    USERS_UPDATE: Final = "users.account.update"

    ROLES_READ: Final = "rbac.role.read"
    ROLES_ASSIGN: Final = "rbac.role.assign"

    AUDIT_READ: Final = "audit.log.read"

    STUDENTS_READ: Final = "students.profile.read"
    STUDENTS_CREATE: Final = "students.profile.create"
    STUDENTS_UPDATE: Final = "students.profile.update"
    STUDENTS_DELETE: Final = "students.profile.delete"


PERMISSION_DESCRIPTIONS: Mapping[str, str] = {
    P.TENANT_READ: "View the school profile",
    P.TENANT_UPDATE: "Update the school profile and settings",
    P.USERS_READ: "View staff user accounts",
    P.USERS_CREATE: "Create staff user accounts",
    P.USERS_UPDATE: "Update staff user accounts",
    P.ROLES_READ: "View roles and permissions",
    P.ROLES_ASSIGN: "Assign roles to users",
    P.AUDIT_READ: "View the audit log",
    P.STUDENTS_READ: "View student profiles",
    P.STUDENTS_CREATE: "Create student records",
    P.STUDENTS_UPDATE: "Update student records",
    P.STUDENTS_DELETE: "Archive (soft-delete) student records",
}

ALL_PERMISSIONS: frozenset[str] = frozenset(PERMISSION_DESCRIPTIONS)


def require_permission(*permissions: str) -> Callable[[Principal], Principal]:
    """Dependency factory: the principal must hold every permission listed."""
    unknown = set(permissions) - ALL_PERMISSIONS
    if unknown:
        raise ValueError(f"Unknown permission(s): {sorted(unknown)}")
    if not permissions:
        raise ValueError("require_permission needs at least one permission")

    def dependency(
        principal: Annotated[Principal, Depends(get_current_principal)],
    ) -> Principal:
        if not all(principal.has(p) for p in permissions):
            raise ForbiddenError()
        return principal

    return dependency


class Policy[ResourceT]:
    """Resource-level authorization. Subclasses map actions to rule methods.

    Rules return True to allow. Anything not explicitly allowed is denied.
    """

    #: action -> permission that is *required* (still subject to the rule method).
    required_permissions: ClassVar[Mapping[str, str]] = {}

    def can(self, principal: Principal, action: str, resource: ResourceT | None = None) -> bool:
        permission = self.required_permissions.get(action)
        if permission is None or not principal.has(permission):
            return False
        rule = getattr(self, f"rule_{action}", None)
        if rule is None:
            return False
        return bool(rule(principal, resource))

    @final
    def authorize(
        self, principal: Principal, action: str, resource: ResourceT | None = None
    ) -> None:
        """Raise 404 for out-of-scope resources, 403 when the action itself is not allowed."""
        if self.can(principal, action, resource):
            return
        if resource is not None and not self.in_scope(principal, resource):
            raise NotFoundError()
        raise ForbiddenError()

    def in_scope(self, principal: Principal, resource: ResourceT) -> bool:
        """Whether the principal may know the resource exists. Deny by default."""
        return False
