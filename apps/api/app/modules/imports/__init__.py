"""Imports module: public surface (skeleton).

Scope: Bulk import with mapping, dry run, error reports, rollback; list exports.
Requirements: FR-DIO-001 to FR-DIO-003 (FRD).
"""

from app.modules.imports.router import router
from app.modules.imports.service import ImportsService

__all__ = ["ImportsService", "router"]
