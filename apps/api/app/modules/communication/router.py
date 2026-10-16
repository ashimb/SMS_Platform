"""Communication HTTP routes (skeleton).

Scope: Notices and circulars, delivery tracking, emergency broadcast, parent-teacher messaging.
Requirements: FR-COM-001, FR-COM-002, FR-COM-005, FR-COM-006, FR-COM-010, FR-COM-011 (FRD).

No endpoints yet. Routes follow the students module pattern: permission dependency,
rate limiter, schemas in/out, and a service call. Routers never import repositories or models.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.rate_limit import default_limiter

router = APIRouter(
    prefix="/communication", tags=["communication"], dependencies=[Depends(default_limiter())]
)
