"""Students API schemas (C3 core profile only)."""

from __future__ import annotations

from datetime import date, datetime
from typing import Self
from uuid import UUID

from pydantic import Field, model_validator

from app.common.schemas import InputModel, OutputModel
from app.common.validators import AdmissionNo, PastDate, PersonName
from app.modules.students.constants import MAX_AGE_YEARS, MIN_AGE_YEARS, Gender, StudentStatus


def _age_on(dob: date, on: date) -> int:
    return on.year - dob.year - ((on.month, on.day) < (dob.month, dob.day))


class StudentCreate(InputModel):
    admission_no: AdmissionNo
    first_name: PersonName
    middle_name: PersonName | None = None
    last_name: PersonName | None = None
    date_of_birth: PastDate
    gender: Gender
    admission_date: PastDate
    current_grade: str | None = Field(default=None, max_length=20)
    section: str | None = Field(default=None, max_length=10)

    @model_validator(mode="after")
    def _check_age(self) -> Self:
        age = _age_on(self.date_of_birth, self.admission_date)
        if not MIN_AGE_YEARS <= age <= MAX_AGE_YEARS:
            raise ValueError(
                f"Age at admission must be between {MIN_AGE_YEARS} and {MAX_AGE_YEARS} years."
            )
        return self


class StudentUpdate(InputModel):
    first_name: PersonName | None = None
    middle_name: PersonName | None = None
    last_name: PersonName | None = None
    current_grade: str | None = Field(default=None, max_length=20)
    section: str | None = Field(default=None, max_length=10)


class StudentOut(OutputModel):
    id: UUID
    admission_no: str
    first_name: str
    middle_name: str | None
    last_name: str | None
    date_of_birth: date
    gender: str
    admission_date: date
    status: str
    current_grade: str | None
    section: str | None
    created_at: datetime
    updated_at: datetime


class StudentFilters(InputModel):
    status: StudentStatus | None = None
    q: str | None = Field(default=None, min_length=2, max_length=100)
