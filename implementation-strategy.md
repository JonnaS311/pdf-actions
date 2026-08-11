# Estrategia de Implementación: PDF Actions API (FastAPI)

## 1. Resumen del Proyecto
El objetivo es construir una API REST de alto rendimiento utilizando **FastAPI** que permita realizar manipulaciones avanzadas sobre archivos PDF y conversiones entre formatos de imagen y PDF. La arquitectura será stateless, permitiendo que el servicio sea fácilmente desplegable en contenedores (Docker).

## 2. Stack Tecnológico
* **Lenguaje:** Python 3.10+
* **Framework Web:** [FastAPI](https://fastapi.tiangolo.com/) (Asíncrono y de alto rendimiento).
* **Servidor ASGI:** Uvicorn.
* **Librerías de Procesamiento de PDF/Imagen:**
    * `pypdf`: Para unir, dividir y rotar PDFs.
    * `pdf2image`: Para la conversión de PDF a JPG (requiere `poppler`).
    * `Pillow (PIL)`: Para la conversión de JPG a PDF y manipulación de imágenes.
    * `pikepdf`: Para optimización y compresión avanzada de archivos PDF.
* **Gestión de Archivos:** `python-multipart` para el manejo de uploads.

## 3. Arquitectura de Endpoints (API Design)

Todos los endpoints utilizarán `POST` con `multipart/form-data` para recibir los archivos.

| Operación | Endpoint | Payload (Form-data) | Respuesta |
| :--- | :--- | :--- | :--- |
| **Unir PDF** | `/pdf/merge` | `files: List[UploadFile]` | `FileResponse` (PDF unido) |
| **Dividir PDF** | `/pdf/split` | `file: UploadFile`, `pages: List[int]` | `StreamingResponse` (ZIP con partes) |
| **Comprimir PDF** | `/pdf/compress` | `file: UploadFile`, `quality: int` | `FileResponse` (PDF comprimido) |
| **PDF a JPG** | `/pdf/to-jpg` | `file: UploadFile`, `dpi: int` | `FileResponse` (Archivo ZIP con imágenes) |
| **JPG a PDF** | `/pdf/jpg-to-pdf` | `files: List[UploadFile]` | `FileResponse` (PDF único) |
| **Rotar PDF** | `/pdf/rotate` | `file: UploadFile`, `angle: int` | `FileResponse` (PDF rotado) |

## 4. Lógica de Implementación por Módulo

### A. Unir PDF (`merge`)
1. Recibir una lista de archivos `UploadFile`.
2. Leer el contenido de cada archivo en un buffer `io.BytesIO`.
3. Utilizar `pypdf.PdfWriter` para iterar sobre los archivos y añadir sus páginas a un objeto writer único.
4. Retornar el stream del buffer resultante.

### B. Dividir PDF (`split`)
1. Recibir un archivo y una lista de índices de páginas.
2. Utilizar `pypdf.PdfReader` para acceder al documento original.
3. Crear un nuevo `PdfWriter` por cada página solicitada (o un solo PDF con las páginas seleccionadas, según preferencia del usuario).
4. Empaquetar los resultados en un archivo `.zip` usando la librería `zipfile` y devolverlo como `StreamingResponse`.

### C. Comprimir PDF (`compress`)
1. Utilizar `pikepdf` para abrir el documento.
2. Aplicar técnicas de reducción de resolución de imágenes internas y eliminación de metadatos redundantes.
3. Guardar el resultado en un buffer de memoria y retornar al cliente.

### D. Conversión PDF $\rightarrow$ JPG
1. Utilizar `pdf2image.convert_from_bytes`.
2. Convertir cada página renderizada a un objeto `PIL.Image`.
3. Guardar las imágenes en un directorio temporal o buffer.
4. Comprimir todas las imágenes generadas en un archivo `.zip` para que el usuario descargue todas las páginas de una vez.

### E. Conversión JPG $\rightarrow$ PDF
1. Recibir múltiples archivos de imagen.
2. Utilizar `Pillow` para abrir cada imagen y convertirlas al modo `RGB`.
3. Crear un nuevo objeto `Image.new('RGB', ...)` que sirva de lienzo.
4. Utilizar el método `paste` para colocar cada imagen en una página del PDF resultante.
5. Retornar el archivo `.pdf` final.

### F. Rotar PDF (`rotate`)
1. Recibir el archivo y el ángulo (ej: 90, 180, 270).
2. Utilizar `pypdf.PdfReader` para leer las páginas.
3. Aplicar `.rotate(angle)` a cada página del objeto `PdfWriter`.
4. Retornar el PDF transformado.

## 5. Consideraciones de Infraestructura y Seguridad

### Gestión de Memoria y Almacenamiento
* **In-Memory Processing:** Para archivos pequeños/medianos, se usarán `io.BytesIO` para evitar escrituras en disco y latencia.
* **Temporary Files:** Para operaciones pesadas (como PDF a JPG con muchas páginas), se implementará un sistema de limpieza automática usando `tempfile.TemporaryDirectory` para asegurar que el servidor no se llene de basura.

### Seguridad
* **Validación de MIME-type:** Verificar estrictamente que los archivos subidos sean `application/pdf` o `image/jpeg`.
* **Límite de Tamaño:** Implementar un middleware para limitar el tamaño máximo de subida (ej: 50MB) y prevenir ataques de Denegación de Servicio (DoS).
* **Sanitización:** Limpiar nombres de archivos para evitar ataques de *Path Traversal*.

### Manejo de Errores
* Implementar un `exception_handler` global en FastAPI para capturar errores de lectura de PDF corruptos y devolver un JSON estructurado: `{ "error": "Invalid PDF format", "detail": "..." }`.

## 6. Próximos Pasos (Roadmap)
1. **Fase 1:** Setup del entorno y estructura de carpetas.
2. **Fase 2:** Implementación de los módulos de lectura/escritura básicos (Merge/Rotate).
3. **Fase 3:** Integración de dependencias externas (`poppler` para `pdf2image`).
4. **Fase 4:** Implementación de la lógica de compresión y conversión de imágenes.
5. **Fase 5:** Dockerización del servicio.