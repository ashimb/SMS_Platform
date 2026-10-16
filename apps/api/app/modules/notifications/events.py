"""Notifications domain events (skeleton).

Scope: Notification engine: templates, channels (in-app, email, SMS, WhatsApp, web push),
preferences, quiet hours, delivery tracking.
Requirements: FR-COM-003, FR-COM-004, FR-COM-007, FR-COM-008, FR-COM-009 (FRD).

Event names follow `<module>.<entity>.<past-tense-verb>`; payloads carry ids, never PII.
"""

from __future__ import annotations

__all__: list[str] = []
