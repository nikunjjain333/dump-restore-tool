import os
import subprocess
import logging
import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.docker_compose import DockerComposeConfig
from app.schemas.docker_compose import (
    DockerComposeConfigCreate,
    DockerComposeConfigUpdate,
)

logger = logging.getLogger(__name__)


def get_docker_compose_configs(db: Session) -> List[DockerComposeConfig]:
    """Get all Docker Compose configurations from database"""
    try:
        return (
            db.query(DockerComposeConfig)
            .filter(DockerComposeConfig.is_active == True)
            .all()
        )
    except Exception as e:
        logger.error(f"Failed to fetch Docker Compose configurations: {e}")
        raise


def get_docker_compose_config(
    db: Session, config_id: int
) -> Optional[DockerComposeConfig]:
    """Get a specific Docker Compose configuration by ID"""
    try:
        return (
            db.query(DockerComposeConfig)
            .filter(DockerComposeConfig.id == config_id)
            .first()
        )
    except Exception as e:
        logger.error(f"Failed to fetch Docker Compose configuration {config_id}: {e}")
        raise


def create_docker_compose_config(
    db: Session, config: DockerComposeConfigCreate
) -> DockerComposeConfig:
    """Create a new Docker Compose configuration in database"""
    try:
        logger.info(
            f"Creating Docker Compose config: {config.name} with path: {config.path}"
        )

        db_config = DockerComposeConfig(**config.dict())
        db.add(db_config)
        db.commit()
        db.refresh(db_config)
        return db_config
    except IntegrityError:
        db.rollback()
        logger.error(
            f"Docker Compose configuration with name '{config.name}' already exists"
        )
        raise ValueError(
            f"Docker Compose configuration with name '{config.name}' already exists"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create Docker Compose configuration: {e}")
        raise


def update_docker_compose_config(
    db: Session, config_id: int, config_update: DockerComposeConfigUpdate
) -> Optional[DockerComposeConfig]:
    """Update an existing Docker Compose configuration"""
    try:
        db_config = get_docker_compose_config(db, config_id)
        if not db_config:
            return None

        update_data = config_update.dict(exclude_unset=True)

        if "path" in update_data:
            logger.info(
                f"Updating Docker Compose config path to: {update_data['path']}"
            )

        for field, value in update_data.items():
            setattr(db_config, field, value)

        db.commit()
        db.refresh(db_config)
        return db_config
    except IntegrityError:
        db.rollback()
        logger.error("Failed to update Docker Compose configuration")
        raise ValueError("Configuration name already exists")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update Docker Compose configuration: {e}")
        raise


def delete_docker_compose_config(db: Session, config_id: int) -> bool:
    """Hard delete a Docker Compose configuration"""
    try:
        db_config = get_docker_compose_config(db, config_id)
        if not db_config:
            return False
        db.delete(db_config)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete Docker Compose configuration: {e}")
        raise


def _validate_compose_path(config_path: str) -> Dict[str, Any]:
    """Validate Docker Compose path and file existence"""
    if not os.path.exists(config_path):
        # Provide helpful error message with container path suggestion
        error_msg = (
            f"Path does not exist: {config_path}. Please check the configuration path."
        )

        # If it looks like a host path, suggest the container path
        if config_path.startswith("/Users/") or config_path.startswith("/home/"):
            # Extract the path after the username
            path_parts = config_path.split("/")
            if len(path_parts) >= 4 and path_parts[1] in ["Users", "home"]:
                # Skip 'Users'/'home' and username, keep the rest
                remaining_path = "/".join(path_parts[3:])
                suggested_path = f"/home/{remaining_path}"
                error_msg += (
                    f"\n\nSuggestion: Try using the container path: {suggested_path}"
                )

        return {"success": False, "message": error_msg}

    compose_file = os.path.join(config_path, "docker-compose.yml")
    if not os.path.exists(compose_file):
        return {
            "success": False,
            "message": f"docker-compose.yml not found in path: {config_path}. Please ensure the file exists.",
        }

    return {"success": True}


def _build_compose_command(
    operation: str,
    service_name: Optional[str] = None,
    flags: Optional[Dict[str, Any]] = None,
) -> List[str]:
    """Build Docker Compose command with flags and operation"""
    cmd = ["docker-compose"]

    # Add flags
    if flags:
        for flag, value in flags.items():
            if isinstance(value, bool):
                if value:
                    cmd.append(f"--{flag}")
            else:
                cmd.append(f"--{flag}")
                cmd.append(str(value))

    # Add operation
    cmd.append(operation)

    # Add service name if specified
    if service_name:
        cmd.append(service_name)

    return cmd


def run_docker_compose_operation(
    db: Session,
    config_id: int,
    operation: str,
    service_name: Optional[str] = None,
    flags: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Run a Docker Compose operation"""
    try:
        # Get configuration from database
        config = get_docker_compose_config(db, config_id)
        if not config:
            return {
                "success": False,
                "message": f"Docker Compose configuration with ID {config_id} not found",
            }

        # Validate path
        validation = _validate_compose_path(config.path)
        if not validation["success"]:
            return validation

        # Build command
        cmd = _build_compose_command(operation, service_name, flags)
        logger.info(
            f"Executing Docker Compose command: {' '.join(cmd)} in directory: {config.path}"
        )

        # Execute command
        result = subprocess.run(
            cmd,
            cwd=config.path,
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
        )

        if result.returncode == 0:
            return {
                "success": True,
                "message": f"Docker Compose {operation} completed successfully",
                "output": result.stdout,
            }
        else:
            return {
                "success": False,
                "message": f"Docker Compose {operation} failed: {result.stderr}",
                "output": result.stderr,
            }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "message": f"Docker Compose {operation} timed out after 5 minutes",
        }
    except Exception as e:
        logger.error(f"Docker Compose operation failed: {e}")
        return {
            "success": False,
            "message": f"Docker Compose operation failed: {str(e)}",
        }


def get_docker_compose_services(config_path: str) -> Dict[str, Any]:
    """Get list of services from docker-compose.yml with service name, container name, and status"""
    try:
        # Validate path
        validation = _validate_compose_path(config_path)
        if not validation["success"]:
            return validation

        result = subprocess.run(
            ["docker-compose", "ps", "-a", "--format", "json"],
            cwd=config_path,
            capture_output=True,
            text=True,
        )

        if result.returncode == 0:
            services = []
            try:
                if not result.stdout.strip():
                    return {"success": True, "services": []}

                try:
                    # Try parsing as a JSON array (Compose v2+)
                    service_infos = json.loads(result.stdout)
                except json.JSONDecodeError:
                    # Fallback: parse as NDJSON (Compose v1)
                    service_infos = [json.loads(line) for line in result.stdout.strip().splitlines() if line.strip()]

                for service_info in service_infos:
                    services.append(
                        {
                            "service_name": service_info.get("Service")
                            or service_info.get("Name")
                            or "Unknown",
                            "container_name": service_info.get("Name")
                            or service_info.get("Service")
                            or "Unknown",
                            "status": service_info.get("State")
                            or service_info.get("Status")
                            or "Unknown",
                        }
                    )
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse docker-compose ps JSON output: {e}")
                return {
                    "success": False,
                    "message": f"Failed to parse docker-compose ps output: {str(e)}",
                }
            except Exception as e:
                logger.error(f"Unexpected error parsing docker-compose ps output: {e}")
                return {
                    "success": False,
                    "message": f"Failed to parse docker-compose ps output: {str(e)}",
                }
            return {"success": True, "services": services}
        else:
            return {
                "success": False,
                "message": f"Failed to get services: {result.stderr}",
            }
    except Exception as e:
        logger.error(f"Failed to get Docker Compose services: {e}")
        return {"success": False, "message": f"Failed to get services: {str(e)}"}


def get_stack_database_info(stack_name: str) -> Dict[str, Any]:
    """Get database container information from a Docker Compose stack"""
    try:
        # Get all containers in the stack
        result = subprocess.run(
            [
                "docker",
                "ps",
                "--filter",
                f"label=com.docker.compose.project={stack_name}",
                "--format",
                "json",
            ],
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            return {
                "success": False,
                "message": f"Failed to get containers for stack '{stack_name}': {result.stderr}",
            }

        containers = []
        try:
            for line in result.stdout.strip().split("\n"):
                if line.strip():
                    containers.append(json.loads(line))
        except json.JSONDecodeError:
            return {
                "success": False,
                "message": f"Failed to parse container information for stack '{stack_name}'",
            }

        # Find database containers (postgres, mysql, etc.)
        db_containers = []
        for container in containers:
            image = container.get("Image", "")
            name = container.get("Names", "")

            # Check for database images
            if any(
                db_type in image.lower()
                for db_type in ["postgres", "mysql", "mongodb", "redis"]
            ):
                db_containers.append(
                    {
                        "name": name,
                        "image": image,
                        "id": container.get("ID", ""),
                        "status": container.get("Status", ""),
                        "ports": container.get("Ports", ""),
                        "db_type": (
                            "postgres"
                            if "postgres" in image.lower()
                            else (
                                "mysql"
                                if "mysql" in image.lower()
                                else (
                                    "mongodb"
                                    if "mongodb" in image.lower()
                                    else (
                                        "redis"
                                        if "redis" in image.lower()
                                        else "unknown"
                                    )
                                )
                            )
                        ),
                    }
                )

        if not db_containers:
            return {
                "success": False,
                "message": f"No database containers found in stack '{stack_name}'",
            }

        # For now, return the first database container found
        db_container = db_containers[0]

        # Extract PostgreSQL version from image
        postgres_version = None
        if db_container["db_type"] == "postgres":
            import re

            version_match = re.search(r"postgres:(\d+)", db_container["image"])
            if version_match:
                postgres_version = version_match.group(1)

        return {
            "success": True,
            "message": f"Found database container in stack '{stack_name}'",
            "container": db_container,
            "postgres_version": postgres_version,
            "stack_name": stack_name,
        }

    except Exception as e:
        logger.error(f"Failed to get stack database info: {e}")
        return {
            "success": False,
            "message": f"Failed to get stack database info: {str(e)}",
        }
