"""Helpers para normalización de nombres de archivo."""

import os


def sanitize_filename(filename: str) -> str:
    """Limpia un nombre de archivo para hacerlo seguro como clave en MinIO.

    Args:
        filename: Nombre original del archivo subido.

    Returns:
        Nombre saneado (sin rutas ni caracteres especiales), o "file" si queda vacío.
    """
    safe = os.path.basename(filename.replace("\\", "/")).strip()
    safe = "".join(c for c in safe if c.isalnum() or c in "._- ").strip()
    return safe or "file"
