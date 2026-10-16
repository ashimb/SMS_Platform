"""Unit tests: shared validators and normalisers."""

from __future__ import annotations

from datetime import date, timedelta

import pytest

from app.common import validators as v

pytestmark = pytest.mark.unit


class TestEmail:
    def test_normalises_case_and_whitespace(self) -> None:
        assert v.normalize_email("  Priya.Sharma@Example.COM ") == "priya.sharma@example.com"

    @pytest.mark.parametrize("value", ["", "no-at-sign", "a@", "@b.com", "a@b", "a@localhost"])
    def test_invalid(self, value: str) -> None:
        with pytest.raises(ValueError, match="valid email"):
            v.normalize_email(value)


class TestNames:
    @pytest.mark.parametrize(
        ("raw", "expected"),
        [
            ("  Priya   Sharma ", "Priya Sharma"),
            ("D'Souza", "D'Souza"),
            ("Ann-Marie", "Ann-Marie"),
            ("प्रिया शर्मा", "प्रिया शर्मा"),
            ("A.", "A."),
        ],
    )
    def test_valid(self, raw: str, expected: str) -> None:
        assert v.normalize_name(raw) == expected

    @pytest.mark.parametrize(
        "raw",
        ["", "   ", "Bob1", "a_b", "x" + chr(0x202E) + "y", "<script>", "Tab\tName", "x" * 101],
    )
    def test_invalid(self, raw: str) -> None:
        with pytest.raises(ValueError, match="Name"):
            v.normalize_name(raw)

    def test_nfc_normalisation(self) -> None:
        decomposed = "José"
        assert v.normalize_name(decomposed) == "José"


class TestMobile:
    @pytest.mark.parametrize(
        "raw", ["9876543210", "+91 98765 43210", "+919876543210", "098765 43210"]
    )
    def test_valid_indian_mobiles(self, raw: str) -> None:
        assert v.normalize_indian_mobile(raw) == "+919876543210"

    @pytest.mark.parametrize(
        "raw", ["12345", "5876543210", "+14155550123", "abcdefghij", "98765432109"]
    )
    def test_invalid(self, raw: str) -> None:
        with pytest.raises(ValueError, match="mobile"):
            v.normalize_indian_mobile(raw)


class TestCodes:
    @pytest.mark.parametrize("value", ["ADM/2026/001", "A-1", "12345"])
    def test_admission_no_valid(self, value: str) -> None:
        assert v.validate_admission_no(value) == value

    @pytest.mark.parametrize("value", ["", "has space", "x" * 21, "A;DROP", "../../etc"])
    def test_admission_no_invalid(self, value: str) -> None:
        with pytest.raises(ValueError, match="Admission"):
            v.validate_admission_no(value)

    @pytest.mark.parametrize("value", ["default", "river-side", "a1"])
    def test_slug_valid(self, value: str) -> None:
        assert v.validate_slug(value) == value

    @pytest.mark.parametrize("value", ["Upper", "-start", "end-", "with space", "x" * 51])
    def test_slug_invalid(self, value: str) -> None:
        with pytest.raises(ValueError, match="Slug"):
            v.validate_slug(value)


class TestDates:
    def test_past_and_today_allowed(self) -> None:
        assert v.validate_past_date(date(2015, 6, 1)) == date(2015, 6, 1)

    def test_future_rejected(self) -> None:
        with pytest.raises(ValueError, match="future"):
            v.validate_past_date(date.today() + timedelta(days=3))


class TestPasswordPolicy:
    def test_strong_password_accepted(self) -> None:
        v.check_password_policy("Correct-Horse-Battery-42")

    @pytest.mark.parametrize(
        ("password", "message"),
        [
            ("short", "at least"),
            ("x" * 129, "at most"),
            ("password@123", "too common"),
        ],
    )
    def test_rejected(self, password: str, message: str) -> None:
        with pytest.raises(ValueError, match=message):
            v.check_password_policy(password, min_length=12)

    def test_common_password_rejected_case_insensitively(self) -> None:
        with pytest.raises(ValueError, match="too common"):
            v.check_password_policy("Password@123", min_length=10)

    def test_context_words_rejected(self) -> None:
        with pytest.raises(ValueError, match="must not contain"):
            v.check_password_policy("priyasharma-2026!", context=("Priya Sharma", "priyasharma"))
