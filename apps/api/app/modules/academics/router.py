"""Academics HTTP routes (skeleton).

Scope: Academic years and terms, calendar, classes/sections/streams, subjects, rollover, homework.
Requirements: FR-ACA-001 to FR-ACA-006 (FRD).

No endpoints yet. Routes follow the students module pattern: permission dependency,
rate limiter, schemas in/out, and a service call. Routers never import repositories or models.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.rate_limit import default_limiter

router = APIRouter(
    prefix="/academics", tags=["academics"], dependencies=[Depends(default_limiter())]
)
