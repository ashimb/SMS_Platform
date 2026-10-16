"""Files module: public surface (skeleton).

Scope: Secure file service: pre-signed uploads to quarantine, malware scan, re-encoding, private
storage, signed downloads.
Requirements: FR-MED-001, FR-MED-002, FR-SEC-021 (FRD).
"""

from app.modules.files.router import router
from app.modules.files.service import FilesService

__all__ = ["FilesService", "router"]
