import os
import platform
from typing import List
from app.core.secrets import secrets_manager


class Settings:
    """Application settings from environment variables"""

    # Database - using secrets manager
    DATABASE_URL: str = secrets_manager.get_database_url()

    # API
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8001"))

    # CORS
    CORS_ORIGINS: List[str] = os.getenv(
        "CORS_ORIGINS", "http://localhost:3001,http://127.0.0.1:3001"
    ).split(",")

    # Docker - Use appropriate socket path based on platform
    @staticmethod
    def get_docker_host() -> str:
        """Get Docker host based on platform"""
        system = platform.system().lower()
        default_hosts = {
            "darwin": "unix:///var/run/docker.sock",  # macOS
            "windows": "npipe:////./pipe/docker_engine",  # Windows
            "linux": "unix:///var/run/docker.sock",  # Linux
        }
        return os.getenv(
            "DOCKER_HOST", default_hosts.get(system, "unix:///var/run/docker.sock")
        )

    DOCKER_HOST: str = get_docker_host()

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # Security - using secrets manager
    SECRET_KEY: str = secrets_manager.get_secret("SECRET_KEY", "your-secret-key-change-in-production") or "your-secret-key-change-in-production"
    JWT_SECRET_KEY: str = secrets_manager.get_secret("JWT_SECRET_KEY", "your-jwt-secret-change-in-production") or "your-jwt-secret-change-in-production"

    # File paths for dump and restore operations
    DUMP_BASE_PATH: str = os.getenv("DUMP_BASE_PATH", "/home/Downloads/Database-dumps")
    RESTORE_BASE_PATH: str = os.getenv(
        "RESTORE_BASE_PATH", "/home/Downloads/Database-dumps"
    )


settings = Settings()
