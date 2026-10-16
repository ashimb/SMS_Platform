"""Reusable model mixins.

- `IdMixin`        UUIDv7 primary key (BINARY(16)).
- `TenantMixin`    non-null, indexed `tenant_id` FK to `tenants.id`. Marks a model as
                   tenant-owned: the session guard rejects unscoped queries on it.
- `TimestampMixin` `created_at` / `updated_at` (UTC, microseconds).
- `AuditMixin`     `created_by` / `updated_by`, filled from the audit context on flush.
- `SoftDeleteMixin` `deleted_at` / `deleted_by`; repositories hide deleted rows by default.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, ForeignKeyConstraint, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, declared_attr, mapped_column

from app.db.base import BinaryUUID, UTCDateTime, new_id, utcnow


class IdMixin:
    id: Mapped[uuid.UUID] = mapped_column(BinaryUUID(), primary_key=True, default=new_id)


class TenantMixin:
    @declared_attr
    def tenant_id(cls) -> Mapped[uuid.UUID]:  # noqa: N805 - declared_attr receives the class
        return mapped_column(
            BinaryUUID(),
            ForeignKey("tenants.id", ondelete="RESTRICT"),
            nullable=False,
            index=True,
        )


#: Add to `__table_args__` of any tenant-owned table that other tenant-owned tables reference.
def tenant_parent_key() -> UniqueConstraint:
    """`UNIQUE (tenant_id, id)`: the target of composite tenant foreign keys."""
    return UniqueConstraint("tenant_id", "id")


def tenant_foreign_key(
    table: str, column: str, parent_table: str, *, ondelete: str = "RESTRICT"
) -> tuple[ForeignKeyConstraint, Index]:
    """Composite FK `(tenant_id, column) -> parent_table (tenant_id, id)` plus its index.

    Because `tenant_id` is part of the key, the database itself rejects a row that points at
    another tenant's record (FRD §2.5 / ADR-002), independently of application code.
    """
    return (
        ForeignKeyConstraint(
            ["tenant_id", column],
            [f"{parent_table}.tenant_id", f"{parent_table}.id"],
            name=f"fk_{table}_tenant_{column}_{parent_table}",
            ondelete=ondelete,
        ),
        Index(f"ix_{table}_tenant_id_{column}", "tenant_id", column),
    )


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        UTCDateTime, nullable=False, default=utcnow, onupdate=utcnow
    )


class AuditMixin:
    created_by: Mapped[uuid.UUID | None] = mapped_column(BinaryUUID(), nullable=True)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(BinaryUUID(), nullable=True)


class SoftDeleteMixin:
    deleted_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    deleted_by: Mapped[uuid.UUID | None] = mapped_column(BinaryUUID(), nullable=True)

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None
