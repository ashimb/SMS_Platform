"""Staff HTTP routes (skeleton).

Scope: Staff records, teaching assignments, exit/offboarding, leave and attendance (v1.1).
Requirements: FR-STF-001 to FR-STF-005 (FRD).

No endpoints yet. Routes follow the students module pattern: permission dependency,
rate limiter, schemas in/out, and a service call. Routers never import repositories or models.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.rate_limit import default_limiter

router = APIRouter(prefix="/staff", tags=["staff"], dependencies=[Depends(default_limiter())])
