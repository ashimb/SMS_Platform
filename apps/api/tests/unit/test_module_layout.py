"""Structure: every module has the standard layout and every file imports cleanly (ADR-001)."""

from __future__ import annotations

import importlib
import pkgutil
from pathlib import Path

import pytest

import app.modules

pytestmark = pytest.mark.unit

MODULES = sorted(m.name for m in pkgutil.iter_modules(app.modules.__path__))
LAYOUT = (
    "__init__",
    "router",
    "schemas",
    "service",
    "repository",
    "models",
    "policies",
    "events",
    "constants",
)
EXPECTED_MODULES = {
    "auth", "tenants", "users", "rbac", "audit", "notifications", "files", "students",
    "guardians", "staff", "academics", "timetable", "attendance", "exams", "admissions", "fees",
    "communication", "cms", "reports", "imports",
}  # fmt: skip


def test_all_twenty_modules_exist() -> None:
    assert set(MODULES) == EXPECTED_MODULES


@pytest.mark.parametrize("module", MODULES)
def test_module_has_standard_layout(module: str) -> None:
    folder = Path(app.modules.__path__[0]) / module
    missing = [name for name in LAYOUT if not (folder / f"{name}.py").is_file()]
    assert not missing, f"{module} is missing {missing}"


@pytest.mark.parametrize(("module", "part"), [(m, p) for m in MODULES for p in LAYOUT])
def test_module_file_imports_cleanly(module: str, part: str) -> None:
    name = f"app.modules.{module}" if part == "__init__" else f"app.modules.{module}.{part}"
    imported = importlib.import_module(name)
    assert imported.__doc__, f"{name} needs a module docstring"


@pytest.mark.parametrize("module", MODULES)
def test_public_surface_exposes_router_and_service(module: str) -> None:
    package = importlib.import_module(f"app.modules.{module}")
    exported = set(getattr(package, "__all__", ()))
    assert "router" in exported
    assert any(name.endswith("Service") for name in exported)


@pytest.mark.parametrize("module", MODULES)
def test_skeleton_policies_deny_by_default(module: str) -> None:
    """Policies with no rules must deny every action."""
    from uuid import uuid4

    from app.core.deps import Principal
    from app.core.permissions import ALL_PERMISSIONS, Policy

    policies = importlib.import_module(f"app.modules.{module}.policies")
    principal = Principal(
        user_id=uuid4(),
        tenant_id=uuid4(),
        session_id=None,
        roles=frozenset({"admin"}),
        permissions=ALL_PERMISSIONS,
    )
    for obj in vars(policies).values():
        if isinstance(obj, type) and issubclass(obj, Policy) and obj is not Policy:
            assert not obj().can(principal, "undefined-action")
