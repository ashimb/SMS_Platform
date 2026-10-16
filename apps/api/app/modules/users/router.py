"""Users HTTP routes (staff account administration)."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.common.pagination import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, Page, PageParams
from app.common.schemas import error_responses
from app.core.deps import Principal, TenantDep, UowDep
from app.core.permissions import P, require_permission
from app.core.rate_limit import default_limiter
from app.modules.users.schemas import UserOut, UserUpdate
from app.modules.users.service import UserService

router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(default_limiter())])


def get_service(uow: UowDep, tenant: TenantDep) -> UserService:
    return UserService(uow, tenant)


ServiceDep = Annotated[UserService, Depends(get_service)]


@router.get("", response_model=Page[UserOut], responses=error_responses(401, 403))
def list_users(
    service: ServiceDep,
    principal: Annotated[Principal, Depends(require_permission(P.USERS_READ))],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=MAX_PAGE_SIZE)] = DEFAULT_PAGE_SIZE,
) -> Page[UserOut]:
    return Page.from_result(service.list_users(principal, PageParams(page, page_size)))


@router.get("/{user_id}", response_model=UserOut, responses=error_responses(401, 403, 404))
def get_user(
    user_id: UUID,
    service: ServiceDep,
    principal: Annotated[Principal, Depends(require_permission(P.USERS_READ))],
) -> UserOut:
    return service.get_user(principal, user_id)


@router.patch("/{user_id}", response_model=UserOut, responses=error_responses(401, 403, 404, 422))
def update_user(
    user_id: UUID,
    body: UserUpdate,
    service: ServiceDep,
    principal: Annotated[Principal, Depends(require_permission(P.USERS_UPDATE))],
) -> UserOut:
    return service.update_user(principal, user_id, body)
