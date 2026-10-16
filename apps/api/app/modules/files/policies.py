"""Files policies (skeleton).

Scope: Secure file service: pre-signed uploads to quarantine, malware scan, re-encoding, private
storage, signed downloads.
Requirements: FR-MED-001, FR-MED-002, FR-SEC-021 (FRD).
"""

from __future__ import annotations

from app.core.permissions import Policy


class FilesPolicy(Policy[object]):
    """Deny-by-default placeholder: no actions are allowed until rules are written."""
