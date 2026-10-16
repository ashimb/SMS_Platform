"""Imports policies (skeleton).

Scope: Bulk import with mapping, dry run, error reports, rollback; list exports.
Requirements: FR-DIO-001 to FR-DIO-003 (FRD).
"""

from __future__ import annotations

from app.core.permissions import Policy


class ImportsPolicy(Policy[object]):
    """Deny-by-default placeholder: no actions are allowed until rules are written."""
