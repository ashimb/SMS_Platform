"""Communication policies (skeleton).

Scope: Notices and circulars, delivery tracking, emergency broadcast, parent-teacher messaging.
Requirements: FR-COM-001, FR-COM-002, FR-COM-005, FR-COM-006, FR-COM-010, FR-COM-011 (FRD).
"""

from __future__ import annotations

from app.core.permissions import Policy


class CommunicationPolicy(Policy[object]):
    """Deny-by-default placeholder: no actions are allowed until rules are written."""
