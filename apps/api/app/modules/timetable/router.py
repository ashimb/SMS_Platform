"""Timetable HTTP routes (skeleton).

Scope: Bell schedules, timetable builder with clash detection, publishing, substitutions (v1.1).
Requirements: FR-TT-001 to FR-TT-004 (FRD).

No endpoints yet. Routes follow the students module pattern: permission dependency,
rate limiter, schemas in/out, and a service call. Routers never import repositories or models.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.rate_limit import default_limiter

router = APIRouter(
    prefix="/timetable", tags=["timetable"], dependencies=[Depends(default_limiter())]
)
