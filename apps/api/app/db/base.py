"""Declarative base, MySQL naming conventions, and shared column types."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import BINARY, DateTime, MetaData
from sqlalchemy.dialects import mysql
from sqlalchemy.engine import Dialect
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.types import TypeDecorator

# Deterministic constraint/index names (stable Alembic diffs; MySQL limit is 64 characters).
NAMING_CONVENTION: dict[str, str] = {
    "ix": "ix_%(table_name)s_%(column_0_N_name)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class BinaryUUID(TypeDecorator[uuid.UUID]):
    """UUID stored as BINARY(16) (UUIDv7 keeps inserts index-friendly)."""

    impl = BINARY(16)
    cache_ok = True

    def process_bind_param(self, value: Any, dialect: Dialect) -> bytes | None:
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return value.bytes
        return uuid.UUID(str(value)).bytes

    def process_result_value(self, value: Any, dialect: Dialect) -> uuid.UUID | None:
        if value is None:
            return None
        return uuid.UUID(bytes=bytes(value))


#: Microsecond-precision UTC timestamps (DATETIME(6) on MySQL; stored naive, always UTC).
UTCDateTime = DateTime(timezone=False).with_variant(mysql.DATETIME(fsp=6), "mysql")


def utcnow() -> datetime:
    """Current UTC time as a naive datetime (MySQL DATETIME has no time zone)."""
    return datetime.now(UTC).replace(tzinfo=None)


def new_id() -> uuid.UUID:
    return uuid.uuid7()


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)
