"""Servicio de compresión de PDFs usando pikepdf."""

import io

import pikepdf

from app.core.s3_client import s3_client


class CompressionService:
    """Operaciones de compresión de PDFs."""

    @staticmethod
    async def compress_pdf(file_key: str, quality: int = 75) -> io.BytesIO:
        """Comprime un PDF eliminando objetos y metadatos redundantes.

        Args:
            file_key: Clave del PDF en MinIO.
            quality: Calidad objetivo (1-100). Con calidad alta (>= 50) se
                conservan los streams tal cual; con calidad baja se re-comprimen.

        Returns:
            BytesIO con el PDF comprimido, posicionado al inicio.
        """
        content = await s3_client.get_object_as_bytes(file_key)
        output = io.BytesIO()

        with pikepdf.open(io.BytesIO(content)) as pdf:
            # Eliminar objetos no referenciados y metadatos redundantes
            pdf.remove_unreferenced_resources()
            for key in list(pdf.docinfo.keys()):
                del pdf.docinfo[key]
            with pdf.open_metadata(set_pikepdf_as_editor=False) as meta:
                meta["pdf:Producer"] = "PDF Actions"
                meta["pdf:Creator"] = "PDF Actions"

            # Calidad alta: mantener streams tal cual; calidad baja: re-comprimir
            compress_streams = quality >= 50
            pdf.save(
                output,
                compress_streams=compress_streams,
                object_stream_mode=pikepdf.ObjectStreamMode.generate,
            )

        output.seek(0)
        return output
