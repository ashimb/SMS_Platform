"""Exams policies (skeleton).

Scope: Assessment structures, grading schemes, marks entry, approval workflow, report cards,
publication.
Requirements: FR-EXM-001 to FR-EXM-010 (FRD).
"""

from __future__ import annotations

from app.core.permissions import Policy


class ExamsPolicy(Policy[object]):
    """Deny-by-default placeholder: no actions are allowed until rules are written."""
