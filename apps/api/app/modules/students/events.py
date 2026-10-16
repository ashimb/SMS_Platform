"""Students domain events (payloads carry ids only)."""

from __future__ import annotations

from typing import Final

STUDENT_CREATED: Final = "students.student.created"
STUDENT_UPDATED: Final = "students.student.updated"
