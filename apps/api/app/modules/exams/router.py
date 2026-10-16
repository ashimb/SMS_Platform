"""Exams HTTP routes (skeleton).

Scope: Assessment structures, grading schemes, marks entry, approval workflow, report cards,
publication.
Requirements: FR-EXM-001 to FR-EXM-010 (FRD).

No endpoints yet. Routes follow the students module pattern: permission dependency,
rate limiter, schemas in/out, and a service call. Routers never import repositories or models.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.rate_limit import default_limiter

router = APIRouter(prefix="/exams", tags=["exams"], dependencies=[Depends(default_limiter())])
