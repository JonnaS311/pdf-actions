"""Cliente S3 (MinIO) para lectura y escritura de archivos."""

import os

import boto3
from botocore.exceptions import ClientError


class S3Client:
    """Wrapper sobre boto3 para operar con un bucket de MinIO.

    Lee la configuración desde variables de entorno (MINIO_ENDPOINT,
    MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET_NAME) y gestiona el
    cliente boto3 de forma perezosa (lazy).
    """

    def __init__(self):
        """Inicializa el cliente leyendo la configuración del entorno."""
        self.endpoint_url = os.getenv("MINIO_ENDPOINT")
        self.access_key = os.getenv("MINIO_ACCESS_KEY")
        self.secret_key = os.getenv("MINIO_SECRET_KEY")
        self.bucket_name = os.getenv("MINIO_BUCKET_NAME", "pdf-actions")

        self.client = None

    def _get_client(self):
        """Crea y devuelve el cliente boto3, cacheándolo para usos posteriores.

        Normaliza el endpoint (agrega esquema http:// y desactiva SSL si no lo
        trae) y asegura que el bucket exista.

        Returns:
            El cliente boto3 de S3.

        Raises:
            ValueError: si faltan variables de entorno de configuración.
        """
        if self.client is not None:
            return self.client
        if not all([self.endpoint_url, self.access_key, self.secret_key]):
            raise ValueError("Missing MinIO configuration environment variables.")
        endpoint_url = self.endpoint_url
        use_ssl = True
        if not endpoint_url.startswith(("http://", "https://")):
            endpoint_url = f"http://{endpoint_url}"
            use_ssl = False
        self.client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            use_ssl=use_ssl,
        )
        self._ensure_bucket()
        return self.client

    def _ensure_bucket(self) -> None:
        """Crea el bucket si no existe.

        Ignora los códigos de error 403/Forbidden (sin permisos para verificar).
        """
        try:
            self.client.head_bucket(Bucket=self.bucket_name)
        except ClientError as e:
            code = e.response["Error"]["Code"]
            if code in ("404", "NoSuchBucket"):
                self.client.create_bucket(Bucket=self.bucket_name)
            elif code not in ("403", "AccessDenied", "Forbidden"):
                raise

    async def get_object_as_bytes(self, file_key: str) -> bytes:
        """Descarga un objeto de MinIO como bytes.

        Args:
            file_key: Clave del objeto en el bucket.

        Returns:
            Contenido del objeto en bytes.

        Raises:
            ValueError: si la clave no existe o falla la descarga.
        """
        try:
            response = self._get_client().get_object(Bucket=self.bucket_name, Key=file_key)
            return response["Body"].read()
        except ClientError as e:
            if e.response["Error"]["Code"] == "NoSuchKey":
                raise ValueError(f"File not found in storage: {file_key}") from e
            raise e

    async def get_objects_as_bytes(self, file_keys: list[str]) -> list[bytes]:
        """Descarga varios objetos de MinIO en orden.

        Args:
            file_keys: Lista de claves de objetos en el bucket.

        Returns:
            Lista con el contenido de cada objeto en bytes, en el mismo orden.
        """
        return [await self.get_object_as_bytes(key) for key in file_keys]

    async def put_object(self, file_key: str, content: bytes, content_type: str) -> None:
        """Sube un objeto a MinIO.

        Args:
            file_key: Clave con la que se almacena el objeto.
            content: Contenido del objeto en bytes.
            content_type: Tipo MIME del objeto.

        Raises:
            ValueError: si falla la subida.
        """
        try:
            self._get_client().put_object(
                Bucket=self.bucket_name,
                Key=file_key,
                Body=content,
                ContentType=content_type,
            )
        except ClientError as e:
            raise ValueError(f"Failed to upload file to storage: {file_key}") from e

    async def delete_objects(self, file_keys: list[str]) -> None:
        """Elimina varios objetos de MinIO en una sola petición.

        Args:
            file_keys: Lista de claves de objetos a eliminar (no hace nada si está vacía).
        """
        if not file_keys:
            return
        self._get_client().delete_objects(
            Bucket=self.bucket_name,
            Delete={"Objects": [{"Key": key} for key in file_keys], "Quiet": True},
        )


# Instancia única compartida por toda la aplicación
s3_client = S3Client()
