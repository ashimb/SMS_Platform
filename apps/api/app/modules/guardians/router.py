"""Guardians HTTP routes (skeleton).

Scope: Guardian records, student links, custody/access restrictions, invitations, contact changes.
Requirements: FR-GRD-001 to FR-GRD-005 (FRD).

No endpoints yet. Routes follow the students module pattern: permission dependency,
rate limiter, schemas in/out, and a service call. Routers never import repositories or models.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.rate_limit import default_limiter

router = APIRouter(
    prefix="/guardians", tags=["guardians"], dependencies=[Depends(default_limiter())]
)
