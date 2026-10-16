"""Unit tests: pagination primitives."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.common.pagination import MAX_PAGE_SIZE, Page, PageParams, PageResult, page_count

pytestmark = pytest.mark.unit


@pytest.mark.parametrize(
    ("page", "size", "offset"), [(1, 50, 0), (2, 50, 50), (3, 20, 40), (10, 1, 9)]
)
def test_offset(page: int, size: int, offset: int) -> None:
    assert PageParams(page, size).offset == offset


@pytest.mark.parametrize(("page", "size"), [(0, 10), (-1, 10), (1, 0), (1, MAX_PAGE_SIZE + 1)])
def test_invalid_params_rejected(page: int, size: int) -> None:
    with pytest.raises(ValueError, match="page"):
        PageParams(page, size)


@pytest.mark.parametrize(
    ("total", "size", "pages"), [(0, 10, 0), (1, 10, 1), (10, 10, 1), (11, 10, 2), (199, 50, 4)]
)
def test_page_count(total: int, size: int, pages: int) -> None:
    assert page_count(total, size) == pages


def test_page_count_rejects_invalid_input() -> None:
    with pytest.raises(ValueError, match="total"):
        page_count(-1, 10)
    with pytest.raises(ValueError, match="page_size"):
        page_count(1, 0)


def test_result_map_preserves_metadata() -> None:
    result = PageResult(items=[1, 2, 3], total=13, page=2, page_size=3)
    mapped = result.map(str)
    assert mapped.items == ["1", "2", "3"]
    assert (mapped.total, mapped.page, mapped.page_size, mapped.pages) == (13, 2, 3, 5)


def test_page_from_result() -> None:
    page = Page[str].from_result(PageResult(items=["a"], total=1, page=1, page_size=50))
    assert page.model_dump() == {"items": ["a"], "total": 1, "page": 1, "page_size": 50, "pages": 1}


def test_page_rejects_invalid_values() -> None:
    with pytest.raises(ValidationError):
        Page[str](items=[], total=-1, page=1, page_size=10, pages=0)
