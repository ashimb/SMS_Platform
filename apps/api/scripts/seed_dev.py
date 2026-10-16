"""Seed a development database.

    uv run python -m scripts.seed_dev            (from apps/api)
    make seed                                    (inside the dev stack)

Creates, idempotently:
1. the permission catalogue;
2. the default tenant (DEFAULT_TENANT_ID / DEFAULT_TENANT_SLUG) with system roles and an admin;
3. a SECOND tenant (`isolation-test`) with its own admin, used only for tenant-isolation testing.

Admin passwords come from SEED_ADMIN_PASSWORD / SEED_ISOLATION_ADMIN_PASSWORD when set; otherwise
a random password is generated and printed once. Refuses to run in staging or production.
"""

from __future__ import annotations

import os
import sys

from app.core.config import get_settings
from app.db.session import get_session_factory
from app.db.uow import UnitOfWork
from scripts._seeding import SeededTenant, seed_tenant

ISOLATION_TENANT_SLUG = "isolation-test"


def _report(label: str, seeded: SeededTenant) -> None:
    print(f"[{label}] tenant={seeded.tenant.slug} id={seeded.tenant.tenant_id}")
    if seeded.admin_password:
        print(
            f"  admin {seeded.admin_email} created; password (shown once): {seeded.admin_password}"
        )
    else:
        print(f"  admin {seeded.admin_email} already existed (password unchanged)")


def main() -> int:
    settings = get_settings()
    if settings.is_deployed:
        print("seed_dev refuses to run in staging/production.", file=sys.stderr)
        return 1

    with UnitOfWork(get_session_factory()) as uow:
        default = seed_tenant(
            uow,
            slug=settings.default_tenant_slug,
            name=os.environ.get("SEED_TENANT_NAME", "Green Valley Public School"),
            tenant_id=settings.default_tenant_id,
            admin_email=os.environ.get("SEED_ADMIN_EMAIL", "admin@greenvalley.example.com"),
            admin_name="School Administrator",
            admin_password=os.environ.get("SEED_ADMIN_PASSWORD"),
        )
    _report("default", default)

    with UnitOfWork(get_session_factory()) as uow:
        isolation = seed_tenant(
            uow,
            slug=ISOLATION_TENANT_SLUG,
            name="Isolation Test Academy (test only)",
            admin_email=os.environ.get("SEED_ISOLATION_ADMIN_EMAIL", "admin@isolation.example.com"),
            admin_name="Isolation Administrator",
            admin_password=os.environ.get("SEED_ISOLATION_ADMIN_PASSWORD"),
        )
    _report("isolation", isolation)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
