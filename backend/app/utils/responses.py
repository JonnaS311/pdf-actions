"""Helpers de respuesta HTTP para streaming de archivos."""

from fastapi.responses import StreamingResponse


def stream_response(output, media_type: str, filename: str) -> StreamingResponse:
    """Construye una StreamingResponse de descarga de archivo.

    Args:
        output: Stream (p. ej. io.BytesIO) con el contenido del archivo.
        media_type: Tipo MIME del contenido.
        filename: Nombre del archivo para el header Content-Disposition.

    Returns:
        StreamingResponse con el header de descarga configurado.
    """
    return StreamingResponse(
        output,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
