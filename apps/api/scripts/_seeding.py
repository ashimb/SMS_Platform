"""Shared, idempotent seeding helpers used by seed_dev.py, create_tenant.py, and the test suite."""

from __future__ import annotations

import secrets
from dataclasses import dataclass
from uuid import UUID

from app.core.permissions import PERMISSION_DESCRIPTIONS
from app.core.tenancy import TenantContext
from app.db.uow import UnitOfWork
from app.modules.rbac import ROLE_ADMIN, RbacService, ensure_permission_catalogue
from app.modules.tenants import TenantService
from app.modules.users import UserService


@dataclass(frozen=True, slots=True)
class SeededTenant:
    tenant: TenantContext
    admin_user_id: UUID
    admin_email: str
    admin_password: str | None  # only set when the admin was created in this run


def generate_password() -> str:
    """24-character random password (meets the 12-character staff policy)."""
    return secrets.token_urlsafe(18)


def seed_tenant(
    uow: UnitOfWork,
    *,
    slug: str,
    name: str,
    admin_email: str,
    admin_name: str,
    admin_password: str | None = None,
    tenant_id: UUID | None = None,
) -> SeededTenant:
    """Create (or reuse) a tenant with system roles and an admin user. Commits."""
    ensure_permission_catalogue(uow, PERMISSION_DESCRIPTIONS)

    tenants = TenantService(uow)
    context = tenants.find_context(slug) or tenants.create_tenant(
        slug=slug, name=name, tenant_id=tenant_id
    )

    rbac = RbacService(uow, context)
    rbac.ensure_system_roles()

    users = UserService(uow, context)
    created_password: str | None = None
    admin = users.find_by_email(admin_email)
    if admin is None:
        created_password = admin_password or generate_password()
        admin = users.create_user(
            email=admin_email, full_name=admin_name, password=created_password
        )
    rbac.assign_role(admin.id, ROLE_ADMIN)
    uow.commit()
    return SeededTenant(
        tenant=context,
        admin_user_id=admin.id,
        admin_email=admin.email,
        admin_password=created_password,
    )
