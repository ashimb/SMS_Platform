"""Seed accounts and records for the Playwright E2E suite. Development/test only.

    docker compose run --rm api python -m scripts.seed_e2e

Idempotent: every run resets the E2E accounts to a known state (password, no lockout), so a
previous lockout test never leaks into the next run. Creates, in addition to what seed_dev does:

default tenant   admin, teacher, parent (a `viewer`: the FRD's parent role does not exist in the
                 API yet), mfa (admin with TOTP enabled), lockout (teacher used by the lockout test)
                 and one student (fixed id) that the tenant-isolation test reads
second tenant    admin and one student (fixed id) that the default tenant must never see

All accounts share E2E_PASSWORD. Refuses to run in staging or production.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from app.core.config import get_settings
from app.core.permissions import PERMISSION_DESCRIPTIONS
from app.core.security import encrypt_secret, generate_totp_secret, hash_password
from app.core.tenancy import TenantContext
from app.db.session import get_session_factory
from app.db.uow import UnitOfWork
from app.modules.rbac import (
    ROLE_ADMIN,
    ROLE_TEACHER,
    ROLE_VIEWER,
    RbacService,
    ensure_permission_catalogue,
)
from app.modules.students.models import Student
from app.modules.students.repository import StudentRepository
from app.modules.tenants import TenantService
from app.modules.users import UserService
from scripts.seed_dev import ISOLATION_TENANT_SLUG

# Dev-only test credential, not a secret.
DEFAULT_PASSWORD = "Gv-E2e-9fK2!xQw7"  # noqa: S105  # nosec B105

#: Fixed ids so the E2E suite can address records directly (mirrored in e2e/fixtures/seed.ts).
STUDENT_A_ID = UUID("01920000-0000-7000-8000-00000000a001")
STUDENT_B_ID = UUID("01920000-0000-7000-8000-00000000b001")

DEFAULT_ACCOUNTS: tuple[tuple[str, str, str], ...] = (
    ("admin@greenvalley.example.com", "School Administrator", ROLE_ADMIN),
    ("teacher@greenvalley.example.com", "Tara Teacher", ROLE_TEACHER),
    ("parent@greenvalley.example.com", "Priya Parent", ROLE_VIEWER),
    ("mfa@greenvalley.example.com", "Mira Multifactor", ROLE_ADMIN),
    ("lockout@greenvalley.example.com", "Lena Lockout", ROLE_TEACHER),
)
ISOLATION_ACCOUNTS: tuple[tuple[str, str, str], ...] = (
    ("admin@isolation.example.com", "Isolation Administrator", ROLE_ADMIN),
)


def _today() -> date:
    return datetime.now(UTC).date()


def _seed_accounts(
    uow: UnitOfWork,
    tenant: TenantContext,
    accounts: tuple[tuple[str, str, str], ...],
    password: str,
) -> None:
    rbac = RbacService(uow, tenant)
    rbac.ensure_system_roles()
    users = UserService(uow, tenant)
    for email, full_name, role in accounts:
        user = users.find_by_email(email)
        if user is None:
            user = users.create_user(email=email, full_name=full_name, password=password)
        # Known state on every run: password, no lockout, no failed attempts.
        users.users.update(
            user,
            {
                "password_hash": hash_password(password),
                "failed_login_count": 0,
                "locked_until": None,
                "status": "active",
            },
        )
        rbac.assign_role(user.id, role)

    if any(email.startswith("mfa@") for email, _, _ in accounts):
        mfa_user = users.find_by_email("mfa@greenvalley.example.com")
        if mfa_user is not None:
            # The suite only checks that the second step is requested; it never completes it.
            users.users.update(
                mfa_user,
                {
                    "mfa_enabled": True,
                    "mfa_secret_encrypted": encrypt_secret(generate_totp_secret()),
                },
            )


def _seed_student(
    uow: UnitOfWork,
    tenant: TenantContext,
    *,
    student_id: UUID,
    admission_no: str,
    first_name: str,
    last_name: str,
) -> None:
    repo = StudentRepository(uow.session, tenant)
    if repo.get(student_id) is not None:
        return
    repo.add(
        Student(
            id=student_id,
            admission_no=admission_no,
            first_name=first_name,
            last_name=last_name,
            date_of_birth=_today() - timedelta(days=365 * 11 + 40),
            gender="female",
            admission_date=_today() - timedelta(days=30),
            status="enrolled",
            current_grade="VI",
            section="A",
        )
    )


def main() -> int:
    settings = get_settings()
    if settings.is_deployed:
        print("seed_e2e refuses to run in staging/production.", file=sys.stderr)
        return 1
    password = os.environ.get("E2E_PASSWORD", DEFAULT_PASSWORD)

    with UnitOfWork(get_session_factory()) as uow:
        ensure_permission_catalogue(uow, PERMISSION_DESCRIPTIONS)
        tenants = TenantService(uow)
        default = tenants.find_context(settings.default_tenant_slug) or tenants.create_tenant(
            slug=settings.default_tenant_slug,
            name=os.environ.get("SEED_TENANT_NAME", "Green Valley Public School"),
            tenant_id=settings.default_tenant_id,
        )
        isolation = tenants.find_context(ISOLATION_TENANT_SLUG) or tenants.create_tenant(
            slug=ISOLATION_TENANT_SLUG, name="Isolation Test Academy (test only)"
        )
        _seed_accounts(uow, default, DEFAULT_ACCOUNTS, password)
        _seed_accounts(uow, isolation, ISOLATION_ACCOUNTS, password)
        _seed_student(
            uow, default, student_id=STUDENT_A_ID, admission_no="E2E-A-001",
            first_name="Asha", last_name="Verma",
        )  # fmt: skip
        _seed_student(
            uow, isolation, student_id=STUDENT_B_ID, admission_no="E2E-B-001",
            first_name="Bela", last_name="Banerjee",
        )  # fmt: skip
        uow.commit()

    print(
        json.dumps(
            {
                "tenants": {"default": default.slug, "isolation": isolation.slug},
                "students": {"a": str(STUDENT_A_ID), "b": str(STUDENT_B_ID)},
                "accounts": [email for email, _, _ in DEFAULT_ACCOUNTS + ISOLATION_ACCOUNTS],
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
