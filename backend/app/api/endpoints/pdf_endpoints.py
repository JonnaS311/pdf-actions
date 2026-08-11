"""Endpoints HTTP para las operaciones de PDF.

Todos los endpoints reciben las claves de archivos en MinIO, generan el
resultado y eliminan los archivos fuente de MinIO antes de responder.
"""

from fastapi import APIRouter, HTTPException

from app.api.schemas import (
    CompressionRequest,
    JPGToPDFRequest,
    MergeRequest,
    PDFToJPGRequest,
    RotationRequest,
    SplitRequest,
)
from app.services.compression_service import CompressionService
from app.services.image_pdf_service import ImagePDFService
from app.services.pdf_service import PDFService
from app.utils.responses import stream_response
from app.utils.storage import cleanup_sources

router = APIRouter(prefix="/pdf", tags=["PDF Operations"])


@router.post("/merge")
async def merge_pdfs(request: MergeRequest):
    """Fusiona varios PDFs en un único archivo.

    Args:
        request: MergeRequest con las claves de los PDFs en MinIO.

    Returns:
        StreamingResponse con el PDF fusionado.

    Raises:
        HTTPException: 400 si ocurre un error al fusionar.
    """
    try:
        output = await PDFService.merge_pdfs(request.file_keys)
        await cleanup_sources(request.file_keys)
        return stream_response(output, "application/pdf", "merged.pdf")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/split")
async def split_pdf(request: SplitRequest):
    """Extrae páginas específicas de un PDF en un archivo ZIP.

    Args:
        request: SplitRequest con la clave del PDF y los índices de página.

    Returns:
        StreamingResponse con el ZIP de las páginas extraídas.

    Raises:
        HTTPException: 400 si ocurre un error al extraer páginas.
    """
    try:
        output = await PDFService.split_pdf(request.file_key, request.pages)
        await cleanup_sources([request.file_key])
        return stream_response(output, "application/zip", "split_pages.zip")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/compress")
async def compress_pdf(request: CompressionRequest):
    """Comprime un PDF reduciendo su tamaño.

    Args:
        request: CompressionRequest con la clave del PDF y la calidad deseada.

    Returns:
        StreamingResponse con el PDF comprimido.

    Raises:
        HTTPException: 400 si ocurre un error al comprimir.
    """
    try:
        output = await CompressionService.compress_pdf(request.file_key, request.quality)
        await cleanup_sources([request.file_key])
        return stream_response(output, "application/pdf", "compressed.pdf")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/to-jpg")
async def pdf_to_jpg(request: PDFToJPGRequest):
    """Convierte un PDF a imágenes JPG empaquetadas en un ZIP.

    Args:
        request: PDFToJPGRequest con la clave del PDF y el DPI de salida.

    Returns:
        StreamingResponse con el ZIP de las imágenes JPG.

    Raises:
        HTTPException: 400 si ocurre un error en la conversión.
    """
    try:
        output = await ImagePDFService.pdf_to_jpg(request.file_key, request.dpi)
        await cleanup_sources([request.file_key])
        return stream_response(output, "application/zip", "images.zip")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/jpg-to-pdf")
async def jpg_to_pdf(request: JPGToPDFRequest):
    """Convierte varias imágenes JPG en un único PDF.

    Args:
        request: JPGToPDFRequest con las claves de las imágenes en MinIO.

    Returns:
        StreamingResponse con el PDF generado.

    Raises:
        HTTPException: 400 si ocurre un error en la conversión.
    """
    try:
        output = await ImagePDFService.jpg_to_pdf(request.file_keys)
        await cleanup_sources(request.file_keys)
        return stream_response(output, "application/pdf", "images_to_pdf.pdf")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/rotate")
async def rotate_pdf(request: RotationRequest):
    """Rota todas las páginas de un PDF en un ángulo dado.

    Args:
        request: RotationRequest con la clave del PDF y el ángulo de rotación.

    Returns:
        StreamingResponse con el PDF rotado.

    Raises:
        HTTPException: 400 si ocurre un error al rotar.
    """
    try:
        output = await PDFService.rotate_pdf(request.file_key, request.angle)
        await cleanup_sources([request.file_key])
        return stream_response(output, "application/pdf", "rotated.pdf")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
