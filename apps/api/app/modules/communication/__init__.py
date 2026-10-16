"""Communication module: public surface (skeleton).

Scope: Notices and circulars, delivery tracking, emergency broadcast, parent-teacher messaging.
Requirements: FR-COM-001, FR-COM-002, FR-COM-005, FR-COM-006, FR-COM-010, FR-COM-011 (FRD).
"""

from app.modules.communication.router import router
from app.modules.communication.service import CommunicationService

__all__ = ["CommunicationService", "router"]
