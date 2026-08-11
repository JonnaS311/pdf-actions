"""Aplicación FastAPI "PDF Actions API".

Expone los routers de operaciones PDF y de subida de archivos.
"""

from fastapi import FastAPI

from app.api.endpoints import pdf_endpoints, upload_endpoints

# Instancia principal de la aplicación
app = FastAPI(title="PDF Actions API")

# Registro de routers: operaciones PDF (/pdf) y subida de archivos (/files)
app.include_router(pdf_endpoints.router)
app.include_router(upload_endpoints.router)
