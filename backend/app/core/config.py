import os
import platform
from typing import List

class Settings:
    """Application settings from environment variables"""
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/dump_restore")
    
    # API
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    
    # CORS
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    
    # Docker - Use appropriate socket path based on platform
    @staticmethod
    def get_docker_host() -> str:
        """Get Docker host based on platform"""
        system = platform.system().lower()
        default_hosts = {
            "darwin": "unix:///var/run/docker.sock",  # macOS
            "windows": "npipe:////./pipe/docker_engine",  # Windows
            "linux": "unix:///var/run/docker.sock"  # Linux
        }
        return os.getenv("DOCKER_HOST", default_hosts.get(system, "unix:///var/run/docker.sock"))
    
    DOCKER_HOST: str = get_docker_host()
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")

settings = Settings() 