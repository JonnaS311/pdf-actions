import pytest
from botocore.exceptions import ClientError

from app.core.s3_client import S3Client


class TestS3Client:
    def test_endpoint_without_scheme_gets_http_and_no_ssl(self, monkeypatch):
        captured = {}

        def fake_boto_client(*args, **kwargs):
            captured.update(kwargs)

        monkeypatch.setattr(S3Client, "_ensure_bucket", lambda self: None)
        import boto3

        monkeypatch.setattr(boto3, "client", fake_boto_client)

        client = S3Client()
        client.endpoint_url = "minio:9000"
        client.access_key = "admin"
        client.secret_key = "password"
        client._get_client()

        assert captured["endpoint_url"] == "http://minio:9000"
        assert captured["use_ssl"] is False

    def test_endpoint_with_scheme_keeps_unchanged(self, monkeypatch):
        captured = {}

        def fake_boto_client(*args, **kwargs):
            captured.update(kwargs)

        import boto3

        monkeypatch.setattr(boto3, "client", fake_boto_client)
        monkeypatch.setattr(S3Client, "_ensure_bucket", lambda self: None)

        client = S3Client()
        client.endpoint_url = "https://minio.example.com"
        client.access_key = "admin"
        client.secret_key = "password"
        client._get_client()

        assert captured["endpoint_url"] == "https://minio.example.com"
        assert captured["use_ssl"] is True

    def test_missing_config_raises(self):
        client = S3Client()
        client.endpoint_url = None
        client.access_key = None
        client.secret_key = None
        with pytest.raises(ValueError, match="Missing MinIO"):
            client._get_client()

    def test_ensure_bucket_creates_missing_bucket(self, monkeypatch):
        calls = []

        class FakeBotoClient:
            def head_bucket(self, **kwargs):
                calls.append("head")
                raise ClientError(
                    {"Error": {"Code": "404", "Message": "Not Found"}}, "HeadBucket"
                )

            def create_bucket(self, **kwargs):
                calls.append("create")

        client = S3Client()
        client.bucket_name = "pdf-actions"
        client.client = FakeBotoClient()
        client._ensure_bucket()

        assert calls == ["head", "create"]

    def test_ensure_bucket_skips_create_when_exists(self):
        calls = []

        class FakeBotoClient:
            def head_bucket(self, **kwargs):
                calls.append("head")
                raise ClientError(
                    {"Error": {"Code": "403", "Message": "Forbidden"}}, "HeadBucket"
                )

            def create_bucket(self, **kwargs):
                calls.append("create")

        client = S3Client()
        client.bucket_name = "pdf-actions"
        client.client = FakeBotoClient()
        client._ensure_bucket()

        assert calls == ["head"]
