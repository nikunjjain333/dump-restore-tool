import docker
from docker.errors import DockerException
import subprocess
import os
import platform
import logging
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

def get_docker_status() -> Dict[str, Any]:
    """
    Get current Docker daemon status
    """
    try:
        # Try to connect to Docker daemon using configured host
        client = docker.from_env(environment={'DOCKER_HOST': settings.DOCKER_HOST})
        client.ping()
        
        # Get additional Docker info
        info = client.info()
        version = client.version()
        
        return {
            "success": True,
            "message": "Docker daemon is running",
            "status": "running",
            "info": {
                "containers": info.get('Containers', 0),
                "images": info.get('Images', 0),
                "version": version.get('Version', 'Unknown'),
                "os": info.get('OperatingSystem', 'Unknown'),
                "architecture": info.get('Architecture', 'Unknown')
            }
        }
    except DockerException as e:
        logger.error(f"Docker connection failed: {e}")
        return {
            "success": False,
            "message": "Docker daemon is not accessible",
            "status": "not_accessible",
            "error": str(e)
        }
    except Exception as e:
        logger.error(f"Unexpected error checking Docker status: {e}")
        return {
            "success": False,
            "message": f"Error checking Docker status: {str(e)}",
            "status": "error",
            "error": str(e)
        }

def start_docker_daemon() -> Dict[str, Any]:
    """
    Check Docker daemon connectivity and provide status
    In containerized environments, we can't start Docker on the host
    """
    try:
        # Try to connect to Docker daemon using configured host
        client = docker.from_env(environment={'DOCKER_HOST': settings.DOCKER_HOST})
        client.ping()
        return {
            "success": True,
            "message": "Docker daemon is accessible and running",
            "status": "running"
        }
    except DockerException as e:
        logger.error(f"Docker connection failed: {e}")
        
        # Check if we're running in a container
        if os.path.exists('/.dockerenv'):
            return {
                "success": False,
                "message": "Docker daemon is not accessible from within the container. Please ensure Docker socket is mounted and Docker Desktop is running on the host.",
                "status": "not_accessible"
            }
        
        # If not in container, try to start Docker (for local development)
        try:
            system = platform.system().lower()
            
            if system == "windows":
                # Windows
                subprocess.run(['net', 'start', 'docker'], check=True)
            elif system == "darwin":
                # macOS
                # Try to start Docker Desktop
                try:
                    subprocess.run(['open', '-a', 'Docker'], check=True)
                    # Wait a moment for Docker to start
                    import time
                    time.sleep(3)
                except subprocess.CalledProcessError:
                    # If Docker Desktop app not found, try alternative methods
                    try:
                        subprocess.run(['launchctl', 'load', '/Library/LaunchDaemons/com.docker.docker.plist'], check=True)
                    except subprocess.CalledProcessError:
                        return {
                            "success": False,
                            "message": "Docker Desktop is not installed or cannot be started. Please install Docker Desktop for macOS.",
                            "status": "not_installed"
                        }
            else:
                # Linux
                subprocess.run(['sudo', 'systemctl', 'start', 'docker'], check=True)
            
            return {
                "success": True,
                "message": "Docker daemon started successfully",
                "status": "started"
            }
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to start Docker daemon: {e}")
            return {
                "success": False,
                "message": f"Failed to start Docker daemon: {str(e)}",
                "status": "error"
            }
        except FileNotFoundError:
            return {
                "success": False,
                "message": "Docker is not installed or not in PATH",
                "status": "not_installed"
            }

def stop_docker_daemon() -> Dict[str, Any]:
    """
    Stop Docker daemon (for local development only)
    """
    try:
        # Check if we're running in a container
        if os.path.exists('/.dockerenv'):
            return {
                "success": False,
                "message": "Cannot stop Docker daemon from within a container. Please stop Docker Desktop manually on the host.",
                "status": "not_allowed"
            }
        
        system = platform.system().lower()
        
        if system == "windows":
            # Windows
            subprocess.run(['net', 'stop', 'docker'], check=True)
        elif system == "darwin":
            # macOS - Try to quit Docker Desktop
            try:
                subprocess.run(['osascript', '-e', 'quit app "Docker"'], check=True)
            except subprocess.CalledProcessError:
                # Alternative method
                try:
                    subprocess.run(['launchctl', 'unload', '/Library/LaunchDaemons/com.docker.docker.plist'], check=True)
                except subprocess.CalledProcessError:
                    return {
                        "success": False,
                        "message": "Failed to stop Docker Desktop. Please stop it manually.",
                        "status": "error"
                    }
        else:
            # Linux
            subprocess.run(['sudo', 'systemctl', 'stop', 'docker'], check=True)
        
        return {
            "success": True,
            "message": "Docker daemon stopped successfully",
            "status": "stopped"
        }
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to stop Docker daemon: {e}")
        return {
            "success": False,
            "message": f"Failed to stop Docker daemon: {str(e)}",
            "status": "error"
        }
    except FileNotFoundError:
        return {
            "success": False,
            "message": "Docker is not installed or not in PATH",
            "status": "not_installed"
        }
    except Exception as e:
        logger.error(f"Unexpected error stopping Docker: {e}")
        return {
            "success": False,
            "message": f"Error stopping Docker: {str(e)}",
            "status": "error"
        }

def get_docker_client():
    """Get Docker client instance"""
    try:
        return docker.from_env(environment={'DOCKER_HOST': settings.DOCKER_HOST})
    except DockerException as e:
        logger.error(f"Failed to connect to Docker: {e}")
        raise Exception("Docker daemon is not running") 