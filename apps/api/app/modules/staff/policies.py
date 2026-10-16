"""Staff policies (skeleton).

Scope: Staff records, teaching assignments, exit/offboarding, leave and attendance (v1.1).
Requirements: FR-STF-001 to FR-STF-005 (FRD).
"""

from __future__ import annotations

from app.core.permissions import Policy


class StaffPolicy(Policy[object]):
    """Deny-by-default placeholder: no actions are allowed until rules are written."""
