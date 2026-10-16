"""RBAC repositories."""

from __future__ import annotations

from collections.abc import Iterable
from uuid import UUID

from sqlalchemy import select

from app.common.repository import GlobalRepository, TenantRepository
from app.modules.rbac.models import Permission, Role, RolePermission, UserRole


class PermissionRepository(GlobalRepository[Permission]):
    model = Permission

    def by_codes(self, codes: Iterable[str]) -> list[Permission]:
        codes = list(codes)
        if not codes:
            return []
        stmt = select(Permission).where(Permission.code.in_(codes))
        return list(self.session.execute(stmt).scalars().all())

    def all(self) -> list[Permission]:
        return list(self.session.execute(select(Permission)).scalars().all())


class RoleRepository(TenantRepository[Role]):
    model = Role

    def get_by_code(self, code: str) -> Role | None:
        return self.session.execute(self.select().where(Role.code == code)).scalar_one_or_none()

    def roles_for_user(self, user_id: UUID) -> list[Role]:
        stmt = self.scope(
            select(Role)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user_id, UserRole.tenant_id == self.tenant.tenant_id)
        )
        return list(self.session.execute(stmt).scalars().all())

    def permission_codes_for_user(self, user_id: UUID) -> set[str]:
        stmt = self.scope(
            select(Permission.code)
            .select_from(Role)
            .join(UserRole, UserRole.role_id == Role.id)
            .join(RolePermission, RolePermission.role_id == Role.id)
            .join(Permission, Permission.id == RolePermission.permission_id)
            .where(
                UserRole.user_id == user_id,
                UserRole.tenant_id == self.tenant.tenant_id,
                RolePermission.tenant_id == self.tenant.tenant_id,
            )
        )
        return set(self.session.execute(stmt).scalars().all())


class RolePermissionRepository(TenantRepository[RolePermission]):
    model = RolePermission

    def permission_ids(self, role_id: UUID) -> set[UUID]:
        stmt = self.scope(
            select(RolePermission.permission_id).where(RolePermission.role_id == role_id)
        )
        return set(self.session.execute(stmt).scalars().all())


class UserRoleRepository(TenantRepository[UserRole]):
    model = UserRole

    def exists(self, user_id: UUID, role_id: UUID) -> bool:
        stmt = self.select().where(UserRole.user_id == user_id, UserRole.role_id == role_id)
        return self.session.execute(stmt).first() is not None
