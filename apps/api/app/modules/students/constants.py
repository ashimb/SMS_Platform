"""Students module constants."""

from __future__ import annotations

from typing import Final, Literal

STUDENT_STATUSES: Final = ("provisional", "enrolled", "withdrawn", "transferred", "alumni")
GENDERS: Final = ("female", "male", "other", "undisclosed")

StudentStatus = Literal["provisional", "enrolled", "withdrawn", "transferred", "alumni"]
Gender = Literal["female", "male", "other", "undisclosed"]

#: Age range at admission (FRD FR-STU-001).
MIN_AGE_YEARS: Final = 2
MAX_AGE_YEARS: Final = 25
