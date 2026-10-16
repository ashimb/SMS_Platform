"""Imports HTTP routes (skeleton).

Scope: Bulk import with mapping, dry run, error reports, rollback; list exports.
Requirements: FR-DIO-001 to FR-DIO-003 (FRD).

No endpoints yet. Routes follow the students module pattern: permission dependency,
rate limiter, schemas in/out, and a service call. Routers never import repositories or models.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.rate_limit import default_limiter

router = APIRouter(prefix="/imports", tags=["imports"], dependencies=[Depends(default_limiter())])
