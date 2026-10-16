"""Fees module: public surface (skeleton).

Scope: Fee heads/structures, concessions, invoices, online/counter payments, receipts, refunds,
ledger, reconciliation.
Requirements: FR-FIN-001 to FR-FIN-018 (FRD).
"""

from app.modules.fees.router import router
from app.modules.fees.service import FeesService

__all__ = ["FeesService", "router"]
