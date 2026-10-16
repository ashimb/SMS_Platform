"""RBAC HTTP routes."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.common.schemas import error_responses
from app.core.deps import Principal, TenantDep, UowDep
from app.core.permissions import P, require_permission
from app.core.rate_limit import default_limiter
from app.modules.rbac.schemas import RoleOut
from app.modules.rbac.service import RbacService

router = APIRouter(prefix="/roles", tags=["rbac"], dependencies=[Depends(default_limiter())])


@router.get("", response_model=list[RoleOut], responses=error_responses(401, 403))
def list_roles(
    uow: UowDep,
    tenant: TenantDep,
    principal: Annotated[Principal, Depends(require_permission(P.ROLES_READ))],
) -> list[RoleOut]:
    return RbacService(uow, tenant).list_roles(principal)
