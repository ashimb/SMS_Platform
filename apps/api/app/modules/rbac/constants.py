"""System roles and their default grants (FRD §3.1; extended as modules are built)."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Final

from app.core.permissions import ALL_PERMISSIONS, P

ROLE_ADMIN: Final = "admin"
ROLE_PRINCIPAL: Final = "principal"
ROLE_TEACHER: Final = "teacher"
ROLE_VIEWER: Final = "viewer"

SYSTEM_ROLES: Final[Mapping[str, tuple[str, frozenset[str]]]] = {
    ROLE_ADMIN: ("Administrator", ALL_PERMISSIONS),
    ROLE_PRINCIPAL: ("Principal", ALL_PERMISSIONS),
    ROLE_TEACHER: ("Teacher", frozenset({P.STUDENTS_READ, P.TENANT_READ})),
    # Signed-in account with no data permissions (used by deny-by-default tests).
    ROLE_VIEWER: ("Viewer", frozenset()),
}
