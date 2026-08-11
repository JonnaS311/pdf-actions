import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client(fake_s3):
    with TestClient(app) as c:
        yield c


class TestUpload:
    def test_upload_pdfs(self, client, fake_s3):
        response = client.post(
            "/files/upload",
            files=[
                ("files", ("doc.pdf", b"%PDF-1.4 fake", "application/pdf")),
                ("files", ("img.jpg", b"\xff\xd8\xff fake", "image/jpeg")),
            ],
        )
        assert response.status_code == 200
        keys = response.json()["file_keys"]
        assert len(keys) == 2
        for key in keys:
            assert key.endswith(("doc.pdf", "img.jpg"))
            assert key in fake_s3.store

    def test_upload_rejects_unsupported_mime(self, client):
        response = client.post(
            "/files/upload",
            files=[("files", ("malware.exe", b"MZ", "application/octet-stream"))],
        )
        assert response.status_code == 400
        assert "no permitido" in response.json()["detail"]

    def test_upload_rejects_file_over_50mb(self, client):
        response = client.post(
            "/files/upload",
            files=[("files", ("big.pdf", b"0" * (50 * 1024 * 1024 + 1), "application/pdf"))],
        )
        assert response.status_code == 413

    def test_upload_sanitizes_path_traversal_filenames(self, client, fake_s3):
        response = client.post(
            "/files/upload",
            files=[
                ("files", ("../../etc/passwd.pdf", b"%PDF-1.4", "application/pdf")),
            ],
        )
        assert response.status_code == 200
        key = response.json()["file_keys"][0]
        assert "/" not in key.split("/", 1)[1]
        assert key in fake_s3.store

    def test_upload_then_merge_roundtrip(self, client, fake_s3):
        upload = client.post(
            "/files/upload",
            files=[("files", ("one.pdf", b"%PDF-1.4", "application/pdf"))],
        )
        key = upload.json()["file_keys"][0]
        assert key in fake_s3.store
