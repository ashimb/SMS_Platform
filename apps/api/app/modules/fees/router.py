"""Fees HTTP routes (skeleton).

Scope: Fee heads/structures, concessions, invoices, online/counter payments, receipts, refunds,
ledger, reconciliation.
Requirements: FR-FIN-001 to FR-FIN-018 (FRD).

No endpoints yet. Routes follow the students module pattern: permission dependency,
rate limiter, schemas in/out, and a service call. Routers never import repositories or models.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.rate_limit import default_limiter

router = APIRouter(prefix="/fees", tags=["fees"], dependencies=[Depends(default_limiter())])
