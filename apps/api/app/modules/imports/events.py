"""Imports domain events (skeleton).

Scope: Bulk import with mapping, dry run, error reports, rollback; list exports.
Requirements: FR-DIO-001 to FR-DIO-003 (FRD).

Event names follow `<module>.<entity>.<past-tense-verb>`; payloads carry ids, never PII.
"""

from __future__ import annotations

__all__: list[str] = []
