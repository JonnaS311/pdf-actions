"""Helpers de almacenamiento: limpieza de archivos fuente en MinIO."""

import logging
from typing import List

from app.core.s3_client import s3_client

logger = logging.getLogger("pdf-actions.utils")


async def cleanup_sources(file_keys: List[str]) -> None:
    """Borra de almacenamiento los archivos fuente ya procesados.

    Nunca lanza excepciones: si el borrado falla se loguea y se continúa,
    para no impedir la respuesta al cliente.

    Args:
        file_keys: Lista de claves de archivos a eliminar de MinIO.
    """
    try:
        await s3_client.delete_objects(file_keys)
    except Exception:
        logger.warning("No se pudieron eliminar los archivos fuente: %s", file_keys, exc_info=True)
