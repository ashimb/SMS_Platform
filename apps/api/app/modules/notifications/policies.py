"""Notifications policies (skeleton).

Scope: Notification engine: templates, channels (in-app, email, SMS, WhatsApp, web push),
preferences, quiet hours, delivery tracking.
Requirements: FR-COM-003, FR-COM-004, FR-COM-007, FR-COM-008, FR-COM-009 (FRD).
"""

from __future__ import annotations

from app.core.permissions import Policy


class NotificationsPolicy(Policy[object]):
    """Deny-by-default placeholder: no actions are allowed until rules are written."""
