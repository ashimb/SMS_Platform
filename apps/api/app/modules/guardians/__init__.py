"""Guardians module: public surface (skeleton).

Scope: Guardian records, student links, custody/access restrictions, invitations, contact changes.
Requirements: FR-GRD-001 to FR-GRD-005 (FRD).
"""

from app.modules.guardians.router import router
from app.modules.guardians.service import GuardiansService

__all__ = ["GuardiansService", "router"]
