"""Domain events.

Modules publish `DomainEvent`s instead of calling each other for side effects. v1 dispatches
in-process and synchronously after commit.

TODO(outbox phase): persist events in an `outbox` table inside the business transaction and
dispatch them from the worker (at-least-once; consumers must be idempotent). FRD §2.3.
Payloads carry ids only, never PII.
"""

from __future__ import annotations

from collections import defaultdict
from collections.abc import Callable, Mapping
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid7

import structlog

logger = structlog.get_logger(__name__)


@dataclass(frozen=True, slots=True)
class DomainEvent:
    name: str
    tenant_id: UUID
    payload: Mapping[str, Any] = field(default_factory=dict)
    event_id: UUID = field(default_factory=uuid7)
    occurred_at: datetime = field(default_factory=lambda: datetime.now(UTC))


Handler = Callable[[DomainEvent], None]


class EventBus:
    def __init__(self) -> None:
        self._handlers: dict[str, list[Handler]] = defaultdict(list)

    def subscribe(self, name: str, handler: Handler) -> None:
        self._handlers[name].append(handler)

    def publish(self, event: DomainEvent) -> None:
        for handler in self._handlers.get(event.name, []):
            try:
                handler(event)
            except Exception:
                # One failing subscriber must not break the request that already committed.
                logger.exception("event_handler_failed", event_name=event.name)


#: Process-wide bus used until the transactional outbox is introduced.
event_bus = EventBus()
