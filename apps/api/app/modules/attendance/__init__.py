"""Attendance module: public surface (skeleton).

Scope: Daily/period attendance, offline sync, absence alerts, leave requests, edits, thresholds.
Requirements: FR-ATT-001 to FR-ATT-007 (FRD).
"""

from app.modules.attendance.router import router
from app.modules.attendance.service import AttendanceService

__all__ = ["AttendanceService", "router"]
