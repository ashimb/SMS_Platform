"""Reports module: public surface (skeleton).

Scope: Role dashboards, standard report catalogue, permission-scoped exports.
Requirements: FR-RPT-001 to FR-RPT-005 (FRD).
"""

from app.modules.reports.router import router
from app.modules.reports.service import ReportsService

__all__ = ["ReportsService", "router"]
