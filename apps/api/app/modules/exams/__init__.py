"""Exams module: public surface (skeleton).

Scope: Assessment structures, grading schemes, marks entry, approval workflow, report cards,
publication.
Requirements: FR-EXM-001 to FR-EXM-010 (FRD).
"""

from app.modules.exams.router import router
from app.modules.exams.service import ExamsService

__all__ = ["ExamsService", "router"]
