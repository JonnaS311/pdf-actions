"""Servicios para operaciones con PDFs usando pypdf."""

import io
import zipfile
from typing import List

from pypdf import PdfReader, PdfWriter

from app.core.s3_client import s3_client


class PDFService:
    """Operaciones de PDF que trabajan sobre archivos en MinIO."""

    @staticmethod
    async def merge_pdfs(file_keys: List[str]) -> io.BytesIO:
        """Fusiona varios PDFs en un único documento.

        Args:
            file_keys: Claves de los PDFs a fusionar, en orden.

        Returns:
            BytesIO con el PDF fusionado, posicionado al inicio.
        """
        writer = PdfWriter()
        contents = await s3_client.get_objects_as_bytes(file_keys)
        for content in contents:
            reader = PdfReader(io.BytesIO(content))
            for page in reader.pages:
                writer.add_page(page)

        output = io.BytesIO()
        writer.write(output)
        output.seek(0)
        return output

    @staticmethod
    async def rotate_pdf(file_key: str, angle: int) -> io.BytesIO:
        """Rota todas las páginas de un PDF.

        Args:
            file_key: Clave del PDF en MinIO.
            angle: Ángulo de rotación en grados.

        Returns:
            BytesIO con el PDF rotado, posicionado al inicio.
        """
        content = await s3_client.get_object_as_bytes(file_key)
        reader = PdfReader(io.BytesIO(content))
        writer = PdfWriter()

        for page in reader.pages:
            page.rotate(angle)
            writer.add_page(page)

        output = io.BytesIO()
        writer.write(output)
        output.seek(0)
        return output

    @staticmethod
    async def split_pdf(file_key: str, pages: List[int]) -> io.BytesIO:
        """Extrae páginas específicas de un PDF y las empaqueta en un ZIP.

        Args:
            file_key: Clave del PDF en MinIO.
            pages: Índices (0-based) de las páginas a extraer.

        Returns:
            BytesIO con un ZIP conteniendo un PDF por página extraída.
        """
        content = await s3_client.get_object_as_bytes(file_key)
        reader = PdfReader(io.BytesIO(content))

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for page_num in pages:
                if 0 <= page_num < len(reader.pages):
                    writer = PdfWriter()
                    writer.add_page(reader.pages[page_num])

                    page_buffer = io.BytesIO()
                    writer.write(page_buffer)
                    page_buffer.seek(0)

                    zip_file.writestr(f"page_{page_num + 1}.pdf", page_buffer.getvalue())

        zip_buffer.seek(0)
        return zip_buffer
