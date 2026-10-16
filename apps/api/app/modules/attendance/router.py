"""Attendance HTTP routes (skeleton).

Scope: Daily/period attendance, offline sync, absence alerts, leave requests, edits, thresholds.
Requirements: FR-ATT-001 to FR-ATT-007 (FRD).

No endpoints yet. Routes follow the students module pattern: permission dependency,
rate limiter, schemas in/out, and a service call. Routers never import repositories or models.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.rate_limit import default_limiter

router = APIRouter(
    prefix="/attendance", tags=["attendance"], dependencies=[Depends(default_limiter())]
)
