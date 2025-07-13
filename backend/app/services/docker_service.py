import docker
from docker.errors import DockerException
import logging
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


def get_docker_status() -> Dict[str, Any]:
    """Get current Docker daemon status"""
    try:
        # Try to connect to Docker daemon using configured host
        client = docker.from_env(environment={"DOCKER_HOST": settings.DOCKER_HOST})
        client.ping()

        # Get additional Docker info
        info = client.info()
        version = client.version()

        return {
            "success": True,
            "message": "Docker daemon is running",
            "status": "running",
            "info": {
                "containers": info.get("Containers", 0),
                "images": info.get("Images", 0),
                "version": version.get("Version", "Unknown"),
                "os": info.get("OperatingSystem", "Unknown"),
                "architecture": info.get("Architecture", "Unknown"),
            },
        }
    except DockerException as e:
        logger.error(f"Docker connection failed: {e}")
        return {
            "success": False,
            "message": "Docker daemon is not accessible",
            "status": "not_accessible",
            "error": str(e),
        }
    except Exception as e:
        logger.error(f"Unexpected error checking Docker status: {e}")
        return {
            "success": False,
            "message": f"Error checking Docker status: {str(e)}",
            "status": "error",
            "error": str(e),
        }


def get_docker_client():
    """Get Docker client instance"""
    try:
        return docker.from_env(environment={"DOCKER_HOST": settings.DOCKER_HOST})
    except DockerException as e:
        logger.error(f"Failed to connect to Docker: {e}")
        raise Exception("Docker daemon is not running")
