"""Attendance policies (skeleton).

Scope: Daily/period attendance, offline sync, absence alerts, leave requests, edits, thresholds.
Requirements: FR-ATT-001 to FR-ATT-007 (FRD).
"""

from __future__ import annotations

from app.core.permissions import Policy


class AttendancePolicy(Policy[object]):
    """Deny-by-default placeholder: no actions are allowed until rules are written."""
