"""Offset pagination primitives.

`PageParams` validates query parameters (page >= 1, 1 <= page_size <= 200). Repositories return a
`PageResult` of ORM rows; services map it to the API schema `Page[ItemT]`.
"""

from __future__ import annotations

import math
from collections.abc import Callable
from dataclasses import dataclass

from pydantic import BaseModel, ConfigDict, Field

MAX_PAGE_SIZE = 200
DEFAULT_PAGE_SIZE = 50


@dataclass(frozen=True, slots=True)
class PageParams:
    page: int = 1
    page_size: int = DEFAULT_PAGE_SIZE

    def __post_init__(self) -> None:
        if self.page < 1:
            raise ValueError("page must be >= 1")
        if not 1 <= self.page_size <= MAX_PAGE_SIZE:
            raise ValueError(f"page_size must be between 1 and {MAX_PAGE_SIZE}")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


def page_count(total: int, page_size: int) -> int:
    if total < 0 or page_size < 1:
        raise ValueError("total must be >= 0 and page_size >= 1")
    return math.ceil(total / page_size) if total else 0


@dataclass(frozen=True, slots=True)
class PageResult[T]:
    items: list[T]
    total: int
    page: int
    page_size: int

    @property
    def pages(self) -> int:
        return page_count(self.total, self.page_size)

    def map[U](self, func: Callable[[T], U]) -> PageResult[U]:
        return PageResult(
            items=[func(item) for item in self.items],
            total=self.total,
            page=self.page,
            page_size=self.page_size,
        )


class Page[ItemT](BaseModel):
    """Paginated API response."""

    model_config = ConfigDict(frozen=True)

    items: list[ItemT]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=MAX_PAGE_SIZE)
    pages: int = Field(ge=0)

    @classmethod
    def from_result(cls, result: PageResult[ItemT]) -> Page[ItemT]:
        return cls(
            items=result.items,
            total=result.total,
            page=result.page,
            page_size=result.page_size,
            pages=result.pages,
        )
