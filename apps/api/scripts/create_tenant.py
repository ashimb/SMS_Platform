"""Create a tenant with system roles and an initial administrator.

    uv run python -m scripts.create_tenant --slug river-side --name "River Side Academy" \\
        --admin-email principal@riverside.example --admin-name "A. Principal"

The administrator's password is generated and printed once; they must change it and enrol MFA
at first sign-in. Platform-operator tool: multi-tenant onboarding UI is a v2 feature.
"""

from __future__ import annotations

import argparse

from app.common.validators import normalize_email, normalize_name, validate_slug
from app.db.session import get_session_factory
from app.db.uow import UnitOfWork
from scripts._seeding import seed_tenant


def _parse(argv: list[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0] if __doc__ else None)
    parser.add_argument("--slug", required=True, type=validate_slug)
    parser.add_argument("--name", required=True)
    parser.add_argument("--admin-email", required=True, type=normalize_email)
    parser.add_argument("--admin-name", required=True, type=normalize_name)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse(argv)
    with UnitOfWork(get_session_factory()) as uow:
        seeded = seed_tenant(
            uow,
            slug=args.slug,
            name=args.name.strip(),
            admin_email=args.admin_email,
            admin_name=args.admin_name,
        )
    print(f"tenant {seeded.tenant.slug} ({seeded.tenant.tenant_id}) ready")
    if seeded.admin_password:
        print(f"admin {seeded.admin_email} password (shown once): {seeded.admin_password}")
    else:
        print(f"admin {seeded.admin_email} already existed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
