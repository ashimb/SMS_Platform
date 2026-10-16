"""Admissions policies (skeleton).

Scope: Enquiries, pipeline, admission cycles and forms, applications, decisions, enrolment
conversion.
Requirements: FR-ADM-001 to FR-ADM-011 (FRD).
"""

from __future__ import annotations

from app.core.permissions import Policy


class AdmissionsPolicy(Policy[object]):
    """Deny-by-default placeholder: no actions are allowed until rules are written."""
