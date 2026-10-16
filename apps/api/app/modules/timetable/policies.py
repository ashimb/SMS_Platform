"""Timetable policies (skeleton).

Scope: Bell schedules, timetable builder with clash detection, publishing, substitutions (v1.1).
Requirements: FR-TT-001 to FR-TT-004 (FRD).
"""

from __future__ import annotations

from app.core.permissions import Policy


class TimetablePolicy(Policy[object]):
    """Deny-by-default placeholder: no actions are allowed until rules are written."""
