"""Guardians policies (skeleton).

Scope: Guardian records, student links, custody/access restrictions, invitations, contact changes.
Requirements: FR-GRD-001 to FR-GRD-005 (FRD).
"""

from __future__ import annotations

from app.core.permissions import Policy


class GuardiansPolicy(Policy[object]):
    """Deny-by-default placeholder: no actions are allowed until rules are written."""
