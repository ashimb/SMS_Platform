"""Admissions HTTP routes (skeleton).

Scope: Enquiries, pipeline, admission cycles and forms, applications, decisions, enrolment
conversion.
Requirements: FR-ADM-001 to FR-ADM-011 (FRD).

No endpoints yet. Routes follow the students module pattern: permission dependency,
rate limiter, schemas in/out, and a service call. Routers never import repositories or models.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.rate_limit import default_limiter

router = APIRouter(
    prefix="/admissions", tags=["admissions"], dependencies=[Depends(default_limiter())]
)
