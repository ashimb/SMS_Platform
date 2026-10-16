"""Admissions module: public surface (skeleton).

Scope: Enquiries, pipeline, admission cycles and forms, applications, decisions, enrolment
conversion.
Requirements: FR-ADM-001 to FR-ADM-011 (FRD).
"""

from app.modules.admissions.router import router
from app.modules.admissions.service import AdmissionsService

__all__ = ["AdmissionsService", "router"]
