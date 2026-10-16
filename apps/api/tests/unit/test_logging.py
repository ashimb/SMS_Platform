"""Unit tests: PII masking in logs (FRD FR-SEC-031)."""

from __future__ import annotations

import pytest

from app.core.logging import REDACTED, mask_pii, mask_text

pytestmark = pytest.mark.unit


@pytest.mark.parametrize(
    ("raw", "must_not_contain"),
    [
        ("contact priya.sharma@example.com now", "priya.sharma@example.com"),
        ("call +91 98765 43210 today", "98765 43210"),
        ("call 9876543210", "9876543210"),
        ("aadhaar 1234 5678 9012", "1234 5678"),
        ("Authorization: Bearer abc.def.ghi", "abc.def.ghi"),
        ("token eyJhbGciOiJFZERTQSJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl", "eyJzdWIiOiIxIn0"),
    ],
)
def test_mask_text(raw: str, must_not_contain: str) -> None:
    assert must_not_contain not in mask_text(raw)


def test_phone_keeps_last_digits_for_support() -> None:
    assert mask_text("9876543210").endswith("43210")


def test_sensitive_keys_redacted_recursively() -> None:
    event = mask_pii(
        None,
        "info",
        {
            "event": "login for a@b.com",
            "password": "hunter2",
            "nested": {"refresh_token": "abc", "safe": "ok"},
            "items": [{"code": "123456"}],
        },
    )
    assert event["password"] == REDACTED
    assert event["nested"]["refresh_token"] == REDACTED
    assert event["nested"]["safe"] == "ok"
    assert event["items"][0]["code"] == REDACTED
    assert "a@b.com" not in event["event"]
