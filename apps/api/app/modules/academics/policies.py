"""Academics policies (skeleton).

Scope: Academic years and terms, calendar, classes/sections/streams, subjects, rollover, homework.
Requirements: FR-ACA-001 to FR-ACA-006 (FRD).
"""

from __future__ import annotations

from app.core.permissions import Policy


class AcademicsPolicy(Policy[object]):
    """Deny-by-default placeholder: no actions are allowed until rules are written."""
