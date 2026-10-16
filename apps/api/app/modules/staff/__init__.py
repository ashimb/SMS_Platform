"""Staff module: public surface (skeleton).

Scope: Staff records, teaching assignments, exit/offboarding, leave and attendance (v1.1).
Requirements: FR-STF-001 to FR-STF-005 (FRD).
"""

from app.modules.staff.router import router
from app.modules.staff.service import StaffService

__all__ = ["StaffService", "router"]
