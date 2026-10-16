"""RBAC module: public surface."""

from app.modules.rbac.constants import ROLE_ADMIN, ROLE_PRINCIPAL, ROLE_TEACHER, ROLE_VIEWER
from app.modules.rbac.router import router
from app.modules.rbac.schemas import RoleOut
from app.modules.rbac.service import RbacService, ensure_permission_catalogue

__all__ = [
    "ROLE_ADMIN",
    "ROLE_PRINCIPAL",
    "ROLE_TEACHER",
    "ROLE_VIEWER",
    "RbacService",
    "RoleOut",
    "ensure_permission_catalogue",
    "router",
]
