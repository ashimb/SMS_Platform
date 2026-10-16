"""Fees policies (skeleton).

Scope: Fee heads/structures, concessions, invoices, online/counter payments, receipts, refunds,
ledger, reconciliation.
Requirements: FR-FIN-001 to FR-FIN-018 (FRD).
"""

from __future__ import annotations

from app.core.permissions import Policy


class FeesPolicy(Policy[object]):
    """Deny-by-default placeholder: no actions are allowed until rules are written."""
