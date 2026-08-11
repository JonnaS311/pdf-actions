"""Modelos Pydantic de solicitud para las operaciones de PDF."""

from pydantic import BaseModel, Field


class MergeRequest(BaseModel):
    """Solicitud para fusionar varios PDFs en uno solo.

    Args:
        file_keys: Lista de rutas de PDFs en MinIO.
    """

    file_keys: list[str] = Field(..., description="Lista de rutas de PDFs en MinIO")


class FileReference(BaseModel):
    """Referencia a un único archivo almacenado en MinIO.

    Args:
        file_key: Ruta o nombre del archivo en el bucket de MinIO.
    """

    file_key: str = Field(..., description="La ruta o nombre del archivo en el bucket de MinIO")


class RotationRequest(FileReference):
    """Solicitud para rotar las páginas de un PDF.

    Args:
        file_key: Ruta o nombre del archivo en el bucket de MinIO.
        angle: Ángulo de rotación en grados (0-360).
    """

    angle: int = Field(90, ge=0, le=360, description="Ángulo de rotación (0-360)")


class SplitRequest(FileReference):
    """Solicitud para extraer páginas específicas de un PDF.

    Args:
        file_key: Ruta o nombre del archivo en el bucket de MinIO.
        pages: Lista de índices de páginas a extraer.
    """

    pages: list[int] = Field(..., description="Lista de índices de páginas a extraer")


class CompressionRequest(FileReference):
    """Solicitud para comprimir un PDF.

    Args:
        file_key: Ruta o nombre del archivo en el bucket de MinIO.
        quality: Calidad de compresión (1-100).
    """

    quality: int = Field(75, ge=1, le=100, description="Calidad de compresión (1-100)")


class PDFToJPGRequest(FileReference):
    """Solicitud para convertir un PDF a imágenes JPG.

    Args:
        file_key: Ruta o nombre del archivo en el bucket de MinIO.
        dpi: Resolución DPI para la conversión.
    """

    dpi: int = Field(200, gt=0, description="Resolución DPI para la conversión")


class JPGToPDFRequest(BaseModel):
    """Solicitud para convertir imágenes JPG a un PDF.

    Args:
        file_keys: Lista de rutas de imágenes en MinIO.
    """

    file_keys: list[str] = Field(..., description="Lista de rutas de imágenes en MinIO")
