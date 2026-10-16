"""RBAC service: permission resolution, system roles, role assignment."""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from uuid import UUID

from app.core.deps import Principal
from app.core.errors import ForbiddenError, NotFoundError
from app.core.permissions import P
from app.core.tenancy import TenantContext
from app.db.uow import UnitOfWork
from app.modules.audit import AuditService
from app.modules.rbac.constants import SYSTEM_ROLES
from app.modules.rbac.models import Permission, Role, RolePermission, UserRole
from app.modules.rbac.repository import (
    PermissionRepository,
    RolePermissionRepository,
    RoleRepository,
    UserRoleRepository,
)
from app.modules.rbac.schemas import RoleOut


def ensure_permission_catalogue(uow: UnitOfWork, descriptions: Mapping[str, str]) -> None:
    """Insert missing permission codes (global table). Caller commits."""
    repo = PermissionRepository(uow.session)
    existing = {p.code for p in repo.by_codes(descriptions)}
    for code, description in sorted(descriptions.items()):
        if code not in existing:
            repo.add(Permission(code=code, description=description))


class RbacService:
    def __init__(self, uow: UnitOfWork, tenant: TenantContext) -> None:
        self.uow = uow
        self.tenant = tenant
        self.roles = RoleRepository(uow.session, tenant)
        self.grants = RolePermissionRepository(uow.session, tenant)
        self.assignments = UserRoleRepository(uow.session, tenant)
        self.permissions = PermissionRepository(uow.session)
        self.audit = AuditService(uow.session, tenant)

    # ---- Resolution (used by authentication) ----------------------------------------------------

    def role_codes_for_user(self, user_id: UUID) -> frozenset[str]:
        return frozenset(role.code for role in self.roles.roles_for_user(user_id))

    def permissions_for_user(self, user_id: UUID) -> frozenset[str]:
        return frozenset(self.roles.permission_codes_for_user(user_id))

    # ---- Administration -------------------------------------------------------------------------

    def ensure_system_roles(self) -> dict[str, Role]:
        """Create/refresh system roles and their grants for this tenant. Caller commits."""
        result: dict[str, Role] = {}
        for code, (name, permission_codes) in SYSTEM_ROLES.items():
            role = self.roles.get_by_code(code)
            if role is None:
                role = self.roles.add(Role(code=code, name=name, is_system=True))
            self._grant(role, permission_codes)
            result[code] = role
        return result

    def assign_role(self, user_id: UUID, role_code: str) -> None:
        """Assign a role to a user in this tenant. Caller commits."""
        role = self.roles.get_by_code(role_code)
        if role is None:
            raise NotFoundError("Role not found.", code="ROLE_NOT_FOUND")
        if not self.assignments.exists(user_id, role.id):
            self.assignments.add(UserRole(user_id=user_id, role_id=role.id))
            self.audit.record(
                "rbac.role.assigned", entity_type="user", entity_id=user_id,
                after={"role": role_code},
            )  # fmt: skip

    def list_roles(self, principal: Principal) -> list[RoleOut]:
        if not principal.has(P.ROLES_READ):
            raise ForbiddenError()
        roles = self.roles.list(order_by=(Role.code,))
        catalogue = {p.id: p.code for p in self.permissions.all()}
        return [
            RoleOut(
                id=role.id,
                code=role.code,
                name=role.name,
                is_system=role.is_system,
                permissions=sorted(
                    catalogue[pid]
                    for pid in self.grants.permission_ids(role.id)
                    if pid in catalogue
                ),
            )
            for role in roles
        ]

    def _grant(self, role: Role, permission_codes: Iterable[str]) -> None:
        current = self.grants.permission_ids(role.id)
        for permission in self.permissions.by_codes(permission_codes):
            if permission.id not in current:
                self.grants.add(RolePermission(role_id=role.id, permission_id=permission.id))
