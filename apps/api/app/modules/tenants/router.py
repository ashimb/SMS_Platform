"""Tenants HTTP routes."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.common.schemas import error_responses
from app.core.deps import TenantDep, UowDep
from app.core.permissions import P, require_permission
from app.core.rate_limit import default_limiter
from app.modules.tenants.schemas import TenantPublicOut, TenantSettingsOut
from app.modules.tenants.service import TenantService

router = APIRouter(prefix="/tenant", tags=["tenant"], dependencies=[Depends(default_limiter())])


def get_service(uow: UowDep) -> TenantService:
    return TenantService(uow)


ServiceDep = Annotated[TenantService, Depends(get_service)]


@router.get("", response_model=TenantPublicOut, responses=error_responses(404))
def get_current_tenant(tenant: TenantDep, service: ServiceDep) -> TenantPublicOut:
    """Public school identity for the current host (used for branding before sign-in)."""
    return service.get_public_profile(tenant)


@router.get(
    "/settings",
    response_model=TenantSettingsOut,
    dependencies=[Depends(require_permission(P.TENANT_READ))],
    responses=error_responses(401, 403, 404),
)
def get_tenant_settings(tenant: TenantDep, service: ServiceDep) -> TenantSettingsOut:
    return service.get_settings(tenant)
