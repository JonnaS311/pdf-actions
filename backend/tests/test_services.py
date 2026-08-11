import io
import zipfile

import pytest
from pdf2image.exceptions import PDFInfoNotInstalledError
from pikepdf import Pdf
from pypdf import PdfReader

from app.services.compression_service import CompressionService
from app.services.image_pdf_service import ImagePDFService
from app.services.pdf_service import PDFService
from tests.conftest import FakeS3


def _read_zip_to_pdf(bytes_io: io.BytesIO, member: str) -> bytes:
    with zipfile.ZipFile(bytes_io) as zf:
        return zf.read(member)


class TestPDFService:
    async def test_merge_pdfs(self, fake_s3):
        output = await PDFService.merge_pdfs(["one_page.pdf", "three_pages.pdf"])
        assert output.read(5) == b"%PDF-"
        output.seek(0)
        reader = PdfReader(output)
        assert len(reader.pages) == 4

    async def test_merge_pdfs_empty(self, fake_s3):
        output = await PDFService.merge_pdfs([])
        assert output.read(5) == b"%PDF-"
        output.seek(0)
        assert len(PdfReader(output).pages) == 0

    async def test_rotate_pdf(self, fake_s3):
        output = await PDFService.rotate_pdf("one_page.pdf", 90)
        assert output.read(5) == b"%PDF-"
        output.seek(0)
        reader = PdfReader(output)
        assert len(reader.pages) == 1
        assert reader.pages[0].rotation == 90

    async def test_split_pdf(self, fake_s3):
        output = await PDFService.split_pdf("three_pages.pdf", [0, 2])
        output.seek(0)
        assert _read_zip_to_pdf(output, "page_1.pdf").startswith(b"%PDF-")
        assert _read_zip_to_pdf(output, "page_3.pdf").startswith(b"%PDF-")
        with zipfile.ZipFile(output) as zf:
            assert set(zf.namelist()) == {"page_1.pdf", "page_3.pdf"}
            assert len(PdfReader(io.BytesIO(zf.read("page_1.pdf"))).pages) == 1

    async def test_split_pdf_out_of_range_pages_silently_skipped(self, fake_s3):
        output = await PDFService.split_pdf("three_pages.pdf", [0, 99])
        output.seek(0)
        with zipfile.ZipFile(output) as zf:
            assert set(zf.namelist()) == {"page_1.pdf"}

    async def test_merge_pdfs_missing_key_raises(self, fake_s3):
        with pytest.raises(ValueError, match="File not found"):
            await PDFService.merge_pdfs(["does_not_exist.pdf"])


class TestImagePDFService:
    async def test_pdf_to_jpg_returns_zip_with_images(self, fake_s3, mock_convert_from_bytes):
        output = await ImagePDFService.pdf_to_jpg("one_page.pdf", dpi=200)
        output.seek(0)
        with zipfile.ZipFile(output) as zf:
            assert set(zf.namelist()) == {"page_1.jpg", "page_2.jpg"}

    async def test_pdf_to_jpg_without_poppler_raises_clear_message(self, fake_s3, monkeypatch):
        from app.services import image_pdf_service

        def no_poppler(content: bytes, dpi: int = 200):
            raise PDFInfoNotInstalledError("poppler not found")

        monkeypatch.setattr(image_pdf_service, "convert_from_bytes", no_poppler)
        with pytest.raises(ValueError, match="poppler"):
            await ImagePDFService.pdf_to_jpg("one_page.pdf", dpi=200)

    async def test_jpg_to_pdf(self, fake_s3):
        output = await ImagePDFService.jpg_to_pdf(["img1.jpg", "img2.jpg"])
        output.seek(0)
        reader = PdfReader(output)
        assert len(reader.pages) == 2

    async def test_jpg_to_pdf_no_images_raises(self, fake_s3):
        with pytest.raises(ValueError, match="No images provided"):
            await ImagePDFService.jpg_to_pdf([])


class TestCompressionService:
    async def test_compress_pdf(self, fake_s3):
        output = await CompressionService.compress_pdf("three_pages.pdf", quality=50)
        output.seek(0)
        with Pdf.open(output) as pdf:
            assert len(pdf.pages) == 3

    async def test_compress_strips_metadata(self, fake_s3, monkeypatch):
        from pypdf import PdfWriter

        from app.services import compression_service

        writer = PdfWriter()
        writer.add_blank_page(width=100, height=100)
        writer.add_metadata({"/Title": "Secret Title"})
        buffer = io.BytesIO()
        writer.write(buffer)

        store = FakeS3({"meta.pdf": buffer.getvalue()})
        monkeypatch.setattr(compression_service, "s3_client", store)

        output = await CompressionService.compress_pdf("meta.pdf", quality=50)
        output.seek(0)
        with Pdf.open(output) as pdf:
            assert "Title" not in pdf.docinfo
            with pdf.open_metadata() as meta:
                assert meta["pdf:Producer"] == "PDF Actions"

    async def test_compress_corrupt_pdf_raises(self, fake_s3, monkeypatch):
        from app.services import compression_service

        corrupt = FakeS3({"bad.pdf": b"not a pdf"})
        monkeypatch.setattr(compression_service, "s3_client", corrupt)
        with pytest.raises(Exception):
            await CompressionService.compress_pdf("bad.pdf", quality=50)
