"""Servicio de conversión entre PDFs e imágenes JPG."""

import io
import tempfile
import zipfile
from pathlib import Path
from typing import List

from PIL import Image
from pdf2image import convert_from_bytes
from pdf2image.exceptions import PDFInfoNotInstalledError

from app.core.s3_client import s3_client


class ImagePDFService:
    """Operaciones de conversión entre PDFs e imágenes."""

    @staticmethod
    async def pdf_to_jpg(file_key: str, dpi: int = 200) -> io.BytesIO:
        """Convierte cada página de un PDF en una imagen JPG.

        Args:
            file_key: Clave del PDF en MinIO.
            dpi: Resolución (DPI) de las imágenes generadas.

        Returns:
            BytesIO con un ZIP de imágenes JPG (una por página).

        Raises:
            ValueError: si poppler (poppler-utils) no está instalado.
        """
        content = await s3_client.get_object_as_bytes(file_key)
        try:
            images = convert_from_bytes(content, dpi=dpi)
        except PDFInfoNotInstalledError as exc:
            raise ValueError(
                "PDF to JPG conversion requires poppler to be installed on the server "
                "(poppler-utils). Please install it or run the service in Docker."
            ) from exc

        # Usar un directorio temporal con limpieza automática para no saturar la memoria
        zip_buffer = io.BytesIO()
        with tempfile.TemporaryDirectory(prefix="pdf-to-jpg-") as tmp_dir:
            tmp_path = Path(tmp_dir)
            for i, image in enumerate(images):
                img_path = tmp_path / f"page_{i + 1}.jpg"
                image.save(img_path, format="JPEG")

            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
                for img_path in sorted(tmp_path.glob("page_*.jpg")):
                    zip_file.write(img_path, arcname=img_path.name)

        zip_buffer.seek(0)
        return zip_buffer

    @staticmethod
    async def jpg_to_pdf(file_keys: List[str]) -> io.BytesIO:
        """Convierte varias imágenes JPG en un único PDF.

        Args:
            file_keys: Claves de las imágenes JPG en MinIO, en orden.

        Returns:
            BytesIO con el PDF generado.

        Raises:
            ValueError: si la lista de imágenes está vacía.
        """
        contents = await s3_client.get_objects_as_bytes(file_keys)
        pdf_images = []
        for content in contents:
            img = Image.open(io.BytesIO(content)).convert("RGB")
            pdf_images.append(img)

        if not pdf_images:
            raise ValueError("No images provided")

        output = io.BytesIO()
        pdf_images[0].save(
            output,
            format="PDF",
            save_all=True,
            append_images=pdf_images[1:],
            resolution=100.0,
        )
        output.seek(0)
        return output
