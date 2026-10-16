"""Reports policies (skeleton).

Scope: Role dashboards, standard report catalogue, permission-scoped exports.
Requirements: FR-RPT-001 to FR-RPT-005 (FRD).
"""

from __future__ import annotations

from app.core.permissions import Policy


class ReportsPolicy(Policy[object]):
    """Deny-by-default placeholder: no actions are allowed until rules are written."""
