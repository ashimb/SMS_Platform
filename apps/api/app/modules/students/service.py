"""Students service: business rules, authorization, transaction, audit, events.

Reference flow for every module:
    router (HTTP, schemas, permission dependency)
      -> service (policy check, rules, repository calls, audit, commit, events)
        -> repository (tenant-scoped queries)
"""

from __future__ import annotations

from uuid import UUID

from app.common.events import DomainEvent, event_bus
from app.common.pagination import PageParams, PageResult
from app.core.deps import Principal
from app.core.errors import ConflictError, NotFoundError
from app.core.tenancy import TenantContext
from app.db.uow import UnitOfWork
from app.modules.audit import AuditService
from app.modules.students.events import STUDENT_CREATED, STUDENT_UPDATED
from app.modules.students.models import Student
from app.modules.students.policies import StudentPolicy
from app.modules.students.repository import StudentRepository
from app.modules.students.schemas import StudentCreate, StudentFilters, StudentOut, StudentUpdate


class StudentService:
    def __init__(self, uow: UnitOfWork, tenant: TenantContext) -> None:
        self.uow = uow
        self.tenant = tenant
        self.students = StudentRepository(uow.session, tenant)
        self.audit = AuditService(uow.session, tenant)
        self.policy = StudentPolicy()

    def list_students(
        self, principal: Principal, params: PageParams, filters: StudentFilters
    ) -> PageResult[StudentOut]:
        self.policy.authorize(principal, "list")
        result = self.students.search(params, status=filters.status, text=filters.q)
        return result.map(StudentOut.model_validate)

    def get_student(self, principal: Principal, student_id: UUID) -> StudentOut:
        student = self._get_or_404(student_id)
        self.policy.authorize(principal, "view", student)
        return StudentOut.model_validate(student)

    def create_student(self, principal: Principal, data: StudentCreate) -> StudentOut:
        self.policy.authorize(principal, "create")
        if self.students.get_by_admission_no(data.admission_no) is not None:
            raise ConflictError(
                "A student with this admission number already exists.",
                code="DUPLICATE_ADMISSION_NO",
            )
        student = self.students.add(Student(**data.model_dump(), status="enrolled"))
        self.audit.record(
            STUDENT_CREATED,
            entity_type="student",
            entity_id=student.id,
            after={"admission_no": student.admission_no, "status": student.status},
        )
        self.uow.commit()
        event_bus.publish(
            DomainEvent(STUDENT_CREATED, self.tenant.tenant_id, {"student_id": str(student.id)})
        )
        return StudentOut.model_validate(student)

    def update_student(
        self, principal: Principal, student_id: UUID, data: StudentUpdate
    ) -> StudentOut:
        student = self._get_or_404(student_id)
        self.policy.authorize(principal, "update", student)
        changes = data.model_dump(exclude_unset=True)
        if changes:
            before = {key: getattr(student, key) for key in changes}
            self.students.update(student, changes)
            self.audit.record(
                STUDENT_UPDATED,
                entity_type="student",
                entity_id=student.id,
                before=before,
                after=changes,
            )
            self.uow.commit()
            event_bus.publish(
                DomainEvent(STUDENT_UPDATED, self.tenant.tenant_id, {"student_id": str(student.id)})
            )
        return StudentOut.model_validate(student)

    def _get_or_404(self, student_id: UUID) -> Student:
        student = self.students.get(student_id)
        if student is None:
            raise NotFoundError()
        return student
