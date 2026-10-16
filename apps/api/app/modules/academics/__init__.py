"""Academics module: public surface (skeleton).

Scope: Academic years and terms, calendar, classes/sections/streams, subjects, rollover, homework.
Requirements: FR-ACA-001 to FR-ACA-006 (FRD).
"""

from app.modules.academics.router import router
from app.modules.academics.service import AcademicsService

__all__ = ["AcademicsService", "router"]
