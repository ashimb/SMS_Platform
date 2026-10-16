"""Timetable module: public surface (skeleton).

Scope: Bell schedules, timetable builder with clash detection, publishing, substitutions (v1.1).
Requirements: FR-TT-001 to FR-TT-004 (FRD).
"""

from app.modules.timetable.router import router
from app.modules.timetable.service import TimetableService

__all__ = ["TimetableService", "router"]
