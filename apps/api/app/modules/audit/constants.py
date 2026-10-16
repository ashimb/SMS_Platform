"""Audit module constants."""

from __future__ import annotations

from typing import Final

#: `prev_hash` of the first record in every tenant's chain.
GENESIS_HASH: Final = "0" * 64

#: Keys whose values are always replaced before being stored in before/after snapshots.
MASKED_FIELDS: Final = frozenset(
    {
        "password",
        "password_hash",
        "mfa_secret_encrypted",
        "mfa_pending_secret_encrypted",
        "token",
        "token_hash",
        "aadhaar_no",
        "medical_notes",
    }
)
MASK: Final = "***"
