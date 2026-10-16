"""Files HTTP routes (skeleton).

Scope: Secure file service: pre-signed uploads to quarantine, malware scan, re-encoding, private
storage, signed downloads.
Requirements: FR-MED-001, FR-MED-002, FR-SEC-021 (FRD).

No endpoints yet. Routes follow the students module pattern: permission dependency,
rate limiter, schemas in/out, and a service call. Routers never import repositories or models.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.rate_limit import default_limiter

router = APIRouter(prefix="/files", tags=["files"], dependencies=[Depends(default_limiter())])
