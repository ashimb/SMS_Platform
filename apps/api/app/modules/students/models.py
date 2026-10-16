"""Student master record (reference implementation of a tenant-owned, soft-deleted model).

Phase 2 holds the core identity and enrolment fields. C4 field groups (health, identifiers,
category) arrive with field-level encryption (FRD FR-STU-001, FR-SEC-028). `current_grade` and
`section` are plain labels until the academics module provides classes/sections.
"""

from __future__ import annotations

from datetime import date

from sqlalchemy import CheckConstraint, Date, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import AuditMixin, IdMixin, SoftDeleteMixin, TenantMixin, TimestampMixin
from app.modules.students.constants import GENDERS, STUDENT_STATUSES


def _in(column: str, values: tuple[str, ...]) -> str:
    return f"{column} IN (" + ", ".join(f"'{v}'" for v in values) + ")"


class Student(IdMixin, TenantMixin, TimestampMixin, AuditMixin, SoftDeleteMixin, Base):
    __tablename__ = "students"
    __table_args__ = (
        UniqueConstraint("tenant_id", "admission_no"),
        Index("ix_students_tenant_id_last_name_first_name", "tenant_id", "last_name", "first_name"),
        Index("ix_students_tenant_id_status", "tenant_id", "status"),
        CheckConstraint(_in("status", STUDENT_STATUSES), name="status"),
        CheckConstraint(_in("gender", GENDERS), name="gender"),
    )

    admission_no: Mapped[str] = mapped_column(String(20), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    middle_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(16), nullable=False)
    admission_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="enrolled")
    current_grade: Mapped[str | None] = mapped_column(String(20), nullable=True)
    section: Mapped[str | None] = mapped_column(String(10), nullable=True)
