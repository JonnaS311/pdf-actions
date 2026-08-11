import io
import pytest
from PIL import Image
from pypdf import PdfWriter


def make_pdf(num_pages: int = 1) -> bytes:
    writer = PdfWriter()
    for _ in range(num_pages):
        writer.add_blank_page(width=200, height=200)
    buffer = io.BytesIO()
    writer.write(buffer)
    return buffer.getvalue()


def make_jpeg(size: tuple[int, int] = (100, 100), color: str = "white") -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", size, color).save(buffer, format="JPEG")
    return buffer.getvalue()


class FakeS3:
    def __init__(self, store: dict[str, bytes] | None = None):
        self.store = store or {}

    async def get_object_as_bytes(self, file_key: str) -> bytes:
        if file_key not in self.store:
            raise ValueError(f"File not found in storage: {file_key}")
        return self.store[file_key]

    async def get_objects_as_bytes(self, file_keys: list[str]) -> list[bytes]:
        return [await self.get_object_as_bytes(key) for key in file_keys]

    async def put_object(self, file_key: str, content: bytes, content_type: str) -> None:
        self.store[file_key] = content

    async def delete_objects(self, file_keys: list[str]) -> None:
        for key in file_keys:
            self.store.pop(key, None)


@pytest.fixture
def s3_store() -> dict[str, bytes]:
    return {
        "one_page.pdf": make_pdf(1),
        "three_pages.pdf": make_pdf(3),
        "img1.jpg": make_jpeg(color="red"),
        "img2.jpg": make_jpeg(color="blue"),
    }


@pytest.fixture
def fake_s3(monkeypatch, s3_store):
    fake = FakeS3(s3_store)
    from app.api.endpoints import upload_endpoints
    from app.services import compression_service, image_pdf_service, pdf_service
    from app.utils import storage

    monkeypatch.setattr(pdf_service, "s3_client", fake)
    monkeypatch.setattr(image_pdf_service, "s3_client", fake)
    monkeypatch.setattr(compression_service, "s3_client", fake)
    monkeypatch.setattr(upload_endpoints, "s3_client", fake)
    monkeypatch.setattr(storage, "s3_client", fake)
    return fake


@pytest.fixture
def mock_convert_from_bytes(monkeypatch):
    from app.services import image_pdf_service

    def fake_convert(content: bytes, dpi: int = 200):
        return [Image.new("RGB", (100, 100), "white"), Image.new("RGB", (100, 100), "black")]

    monkeypatch.setattr(image_pdf_service, "convert_from_bytes", fake_convert)
