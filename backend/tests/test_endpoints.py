import zipfile

import pytest
from fastapi.testclient import TestClient
from pypdf import PdfReader

from app.main import app


@pytest.fixture
def client(fake_s3, mock_convert_from_bytes):
    with TestClient(app) as c:
        yield c


@pytest.fixture
def client_without_poppler(fake_s3, monkeypatch):
    from app.services import image_pdf_service
    from pdf2image.exceptions import PDFInfoNotInstalledError

    def no_poppler(content: bytes, dpi: int = 200):
        raise PDFInfoNotInstalledError("poppler not found")

    monkeypatch.setattr(image_pdf_service, "convert_from_bytes", no_poppler)
    with TestClient(app) as c:
        yield c


class TestMerge:
    def test_merge_pdfs(self, client, fake_s3):
        response = client.post("/pdf/merge", json={"file_keys": ["one_page.pdf", "three_pages.pdf"]})
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert len(PdfReader(io_bytes(response.content)).pages) == 4
        assert "one_page.pdf" not in fake_s3.store
        assert "three_pages.pdf" not in fake_s3.store

    def test_merge_returns_400_on_missing_file(self, client, fake_s3):
        response = client.post("/pdf/merge", json={"file_keys": ["missing.pdf"]})
        assert response.status_code == 400
        assert "File not found" in response.json()["detail"]
        assert "one_page.pdf" in fake_s3.store


class TestRotate:
    def test_rotate_pdf(self, client, fake_s3):
        response = client.post("/pdf/rotate", json={"file_key": "one_page.pdf", "angle": 180})
        assert response.status_code == 200
        assert PdfReader(io_bytes(response.content)).pages[0].rotation == 180
        assert "one_page.pdf" not in fake_s3.store

    def test_rotate_invalid_angle_rejected(self, client):
        response = client.post("/pdf/rotate", json={"file_key": "one_page.pdf", "angle": 999})
        assert response.status_code == 422


class TestSplit:
    def test_split_pdf(self, client, fake_s3):
        response = client.post("/pdf/split", json={"file_key": "three_pages.pdf", "pages": [0, 2]})
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/zip"
        with zipfile.ZipFile(io_bytes(response.content)) as zf:
            assert set(zf.namelist()) == {"page_1.pdf", "page_3.pdf"}
        assert "three_pages.pdf" not in fake_s3.store


class TestCompress:
    def test_compress_pdf(self, client, fake_s3):
        response = client.post("/pdf/compress", json={"file_key": "three_pages.pdf", "quality": 50})
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert "three_pages.pdf" not in fake_s3.store


class TestToJpg:
    def test_pdf_to_jpg(self, client, fake_s3):
        response = client.post("/pdf/to-jpg", json={"file_key": "one_page.pdf", "dpi": 150})
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/zip"
        with zipfile.ZipFile(io_bytes(response.content)) as zf:
            assert set(zf.namelist()) == {"page_1.jpg", "page_2.jpg"}
        assert "one_page.pdf" not in fake_s3.store

    def test_pdf_to_jpg_without_poppler_returns_400(self, client_without_poppler, fake_s3):
        response = client_without_poppler.post(
            "/pdf/to-jpg", json={"file_key": "one_page.pdf", "dpi": 150}
        )
        assert response.status_code == 400
        assert "poppler" in response.json()["detail"]
        assert "one_page.pdf" in fake_s3.store


class TestJpgToPdf:
    def test_jpg_to_pdf(self, client, fake_s3):
        response = client.post("/pdf/jpg-to-pdf", json={"file_keys": ["img1.jpg", "img2.jpg"]})
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert len(PdfReader(io_bytes(response.content)).pages) == 2
        assert "img1.jpg" not in fake_s3.store
        assert "img2.jpg" not in fake_s3.store


def io_bytes(content: bytes):
    import io

    return io.BytesIO(content)
