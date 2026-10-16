"""Object storage (S3-compatible) with tenant-prefixed keys and short-lived pre-signed URLs.

Uploads go client -> storage via pre-signed POST (size and content-type enforced by the
storage service), into the quarantine bucket. Scanning and promotion to the private bucket are
implemented in the files module (FRD FR-MED-001). Downloads use pre-signed GET URLs valid for
5 minutes, issued only after an authorization check on the owning record.
"""

from __future__ import annotations

import mimetypes
from functools import cached_property
from typing import TYPE_CHECKING, Any, Literal
from uuid import uuid7

import boto3
from botocore.config import Config

from app.core.config import Settings, get_settings
from app.core.tenancy import TenantContext

if TYPE_CHECKING:
    from mypy_boto3_s3 import S3Client

BucketKind = Literal["quarantine", "private", "public", "exports"]

PRESIGNED_GET_TTL_SECONDS = 300
PRESIGNED_PUT_TTL_SECONDS = 300


def tenant_object_key(tenant: TenantContext, module: str, filename: str) -> str:
    """Random, non-guessable key under the tenant prefix; keeps only the file extension."""
    extension = mimetypes.guess_extension(mimetypes.guess_type(filename)[0] or "") or ""
    return tenant.storage_key(module, f"{uuid7().hex}{extension}")


class ObjectStorage:
    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()

    def bucket(self, kind: BucketKind) -> str:
        return f"{self._settings.s3_bucket_prefix}-{kind}"

    @cached_property
    def client(self) -> S3Client:
        s = self._settings
        return boto3.client(
            "s3",
            endpoint_url=s.s3_endpoint_url or None,
            region_name=s.s3_region,
            aws_access_key_id=s.s3_access_key_id.get_secret_value() if s.s3_access_key_id else None,
            aws_secret_access_key=(
                s.s3_secret_access_key.get_secret_value() if s.s3_secret_access_key else None
            ),
            config=Config(
                signature_version="s3v4", retries={"max_attempts": 3, "mode": "standard"}
            ),
        )

    def presigned_upload(self, *, key: str, content_type: str, max_bytes: int) -> dict[str, Any]:
        """Pre-signed POST into the quarantine bucket with exact type and size bounds."""
        return self.client.generate_presigned_post(
            Bucket=self.bucket("quarantine"),
            Key=key,
            Fields={"Content-Type": content_type},
            Conditions=[
                {"Content-Type": content_type},
                ["content-length-range", 1, max_bytes],
            ],
            ExpiresIn=PRESIGNED_PUT_TTL_SECONDS,
        )

    def presigned_download(
        self, *, key: str, kind: BucketKind = "private", download_name: str | None = None
    ) -> str:
        params: dict[str, Any] = {"Bucket": self.bucket(kind), "Key": key}
        if download_name:
            safe_name = download_name.replace('"', "").replace("\r", "").replace("\n", "")
            params["ResponseContentDisposition"] = f'attachment; filename="{safe_name}"'
        return self.client.generate_presigned_url(
            "get_object", Params=params, ExpiresIn=PRESIGNED_GET_TTL_SECONDS
        )
