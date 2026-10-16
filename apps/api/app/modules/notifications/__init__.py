"""Notifications module: public surface (skeleton).

Scope: Notification engine: templates, channels (in-app, email, SMS, WhatsApp, web push),
preferences, quiet hours, delivery tracking.
Requirements: FR-COM-003, FR-COM-004, FR-COM-007, FR-COM-008, FR-COM-009 (FRD).
"""

from app.modules.notifications.router import router
from app.modules.notifications.service import NotificationsService

__all__ = ["NotificationsService", "router"]
