"""Students repository: queries only (tenant scoping comes from TenantRepository)."""

from __future__ import annotations

from sqlalchemy import ColumnElement, or_

from app.common.pagination import PageParams, PageResult
from app.common.repository import TenantRepository
from app.modules.students.models import Student


def _escape_like(term: str) -> str:
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


class StudentRepository(TenantRepository[Student]):
    model = Student

    def get_by_admission_no(self, admission_no: str) -> Student | None:
        stmt = self.select(include_deleted=True).where(Student.admission_no == admission_no)
        return self.session.execute(stmt).scalar_one_or_none()

    def search(
        self, params: PageParams, *, status: str | None = None, text: str | None = None
    ) -> PageResult[Student]:
        criteria: list[ColumnElement[bool]] = []
        if status is not None:
            criteria.append(Student.status == status)
        if text:
            pattern = f"%{_escape_like(text)}%"
            criteria.append(
                or_(
                    Student.first_name.ilike(pattern, escape="\\"),
                    Student.last_name.ilike(pattern, escape="\\"),
                    Student.admission_no.ilike(pattern, escape="\\"),
                )
            )
        return self.paginate(
            params,
            *criteria,
            order_by=(Student.last_name, Student.first_name, Student.id),
        )
