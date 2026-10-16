"""Students HTTP routes.

Routers only declare HTTP concerns: path, schemas, permission dependency, rate limit, and status
codes. They never touch the ORM.
"""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.common.pagination import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, Page, PageParams
from app.common.schemas import error_responses
from app.core.deps import Principal, TenantDep, UowDep
from app.core.permissions import P, require_permission
from app.core.rate_limit import default_limiter
from app.modules.students.constants import StudentStatus
from app.modules.students.schemas import StudentCreate, StudentFilters, StudentOut, StudentUpdate
from app.modules.students.service import StudentService

router = APIRouter(prefix="/students", tags=["students"], dependencies=[Depends(default_limiter())])


def get_service(uow: UowDep, tenant: TenantDep) -> StudentService:
    return StudentService(uow, tenant)


ServiceDep = Annotated[StudentService, Depends(get_service)]


@router.get("", response_model=Page[StudentOut], responses=error_responses(401, 403, 422))
def list_students(
    service: ServiceDep,
    principal: Annotated[Principal, Depends(require_permission(P.STUDENTS_READ))],
    status_filter: Annotated[StudentStatus | None, Query(alias="status")] = None,
    q: Annotated[str | None, Query(min_length=2, max_length=100)] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=MAX_PAGE_SIZE)] = DEFAULT_PAGE_SIZE,
) -> Page[StudentOut]:
    filters = StudentFilters(status=status_filter, q=q)
    return Page.from_result(service.list_students(principal, PageParams(page, page_size), filters))


@router.get("/{student_id}", response_model=StudentOut, responses=error_responses(401, 403, 404))
def get_student(
    student_id: UUID,
    service: ServiceDep,
    principal: Annotated[Principal, Depends(require_permission(P.STUDENTS_READ))],
) -> StudentOut:
    return service.get_student(principal, student_id)


@router.post(
    "",
    response_model=StudentOut,
    status_code=status.HTTP_201_CREATED,
    responses=error_responses(401, 403, 409, 422),
)
def create_student(
    body: StudentCreate,
    service: ServiceDep,
    principal: Annotated[Principal, Depends(require_permission(P.STUDENTS_CREATE))],
) -> StudentOut:
    return service.create_student(principal, body)


@router.patch(
    "/{student_id}", response_model=StudentOut, responses=error_responses(401, 403, 404, 422)
)
def update_student(
    student_id: UUID,
    body: StudentUpdate,
    service: ServiceDep,
    principal: Annotated[Principal, Depends(require_permission(P.STUDENTS_UPDATE))],
) -> StudentOut:
    return service.update_student(principal, student_id, body)
