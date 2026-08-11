"""Endpoints HTTP para la subida de archivos a MinIO."""

import os
import uuid
from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.s3_client import s3_client
from app.utils.filenames import sanitize_filename

router = APIRouter(prefix="/files", tags=["Files"])

# Tipos MIME permitidos y límite de tamaño configurable por variable de entorno
ALLOWED_CONTENT_TYPES = {"application/pdf", "image/jpeg"}
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "50"))
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024


@router.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """Sube uno o varios archivos a MinIO y devuelve sus claves.

    Valida el tipo MIME y el tamaño máximo de cada archivo. Cada archivo se
    almacena bajo una clave única compuesta por un UUID y el nombre saneado.

    Args:
        files: Lista de archivos multipart recibidos por el cliente.

    Returns:
        Dict con la lista de claves generadas: {"file_keys": [...]}.

    Raises:
        HTTPException: 400 si el tipo de archivo no está permitido,
            413 si supera el límite de tamaño.
    """
    try:
        file_keys = []
        for file in files:
            if file.content_type not in ALLOWED_CONTENT_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Tipo de archivo no permitido: {file.content_type}",
                )

            content = await file.read()
            if len(content) > MAX_UPLOAD_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail=f"El archivo {file.filename} supera el límite de {MAX_UPLOAD_MB}MB",
                )

            file_key = f"{uuid.uuid4().hex}/{sanitize_filename(file.filename)}"
            await s3_client.put_object(file_key, content, file.content_type)
            file_keys.append(file_key)
        return {"file_keys": file_keys}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
