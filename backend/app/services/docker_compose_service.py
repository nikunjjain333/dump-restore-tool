import os
import subprocess
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.docker_compose import DockerComposeConfig
from app.schemas.docker_compose import DockerComposeConfigCreate, DockerComposeConfigUpdate
from .docker_service import get_docker_client

logger = logging.getLogger(__name__)

def get_docker_compose_configs(db: Session) -> List[DockerComposeConfig]:
    """Get all Docker Compose configurations from database"""
    try:
        return db.query(DockerComposeConfig).filter(DockerComposeConfig.is_active == True).all()
    except Exception as e:
        logger.error(f"Failed to fetch Docker Compose configurations: {e}")
        raise

def get_docker_compose_config(db: Session, config_id: int) -> Optional[DockerComposeConfig]:
    """Get a specific Docker Compose configuration by ID"""
    try:
        return db.query(DockerComposeConfig).filter(DockerComposeConfig.id == config_id).first()
    except Exception as e:
        logger.error(f"Failed to fetch Docker Compose configuration {config_id}: {e}")
        raise

def create_docker_compose_config(db: Session, config: DockerComposeConfigCreate) -> DockerComposeConfig:
    """Create a new Docker Compose configuration in database"""
    try:
        # Log the path for debugging but don't validate it
        logger.info(f"Creating Docker Compose config: {config.name} with path: {config.path}")
        
        db_config = DockerComposeConfig(**config.dict())
        db.add(db_config)
        db.commit()
        db.refresh(db_config)
        return db_config
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Docker Compose configuration with name '{config.name}' already exists: {e}")
        raise ValueError(f"Docker Compose configuration with name '{config.name}' already exists")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create Docker Compose configuration: {e}")
        raise

def update_docker_compose_config(db: Session, config_id: int, config_update: DockerComposeConfigUpdate) -> Optional[DockerComposeConfig]:
    """Update an existing Docker Compose configuration"""
    try:
        db_config = get_docker_compose_config(db, config_id)
        if not db_config:
            return None
        
        update_data = config_update.dict(exclude_unset=True)
        
        # Log path changes for debugging but don't validate
        if 'path' in update_data:
            logger.info(f"Updating Docker Compose config path to: {update_data['path']}")
        
        for field, value in update_data.items():
            setattr(db_config, field, value)
        
        db.commit()
        db.refresh(db_config)
        return db_config
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Failed to update Docker Compose configuration: {e}")
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

def run_docker_compose_operation(db: Session, config_id: int, operation: str, service_name: Optional[str] = None, flags: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Run a Docker Compose operation"""
    try:
        # Get configuration from database
        config = get_docker_compose_config(db, config_id)
        if not config:
            return {
                "success": False,
                "message": f"Docker Compose configuration with ID {config_id} not found"
            }
        
        # Validate that the path exists
        if not os.path.exists(config.path):
            return {
                "success": False,
                "message": f"Path does not exist: {config.path}. Please check the configuration path."
            }
        
        # Check if docker-compose.yml exists in the path
        compose_file = os.path.join(config.path, "docker-compose.yml")
        if not os.path.exists(compose_file):
            return {
                "success": False,
                "message": f"docker-compose.yml not found in path: {config.path}. Please ensure the file exists."
            }
        
        # Build docker-compose command
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
        
        logger.info(f"Executing Docker Compose command: {' '.join(cmd)} in directory: {config.path}")
        
        # Execute command
        result = subprocess.run(
            cmd,
            cwd=config.path,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        if result.returncode == 0:
            return {
                "success": True,
                "message": f"Docker Compose {operation} completed successfully",
                "output": result.stdout
            }
        else:
            return {
                "success": False,
                "message": f"Docker Compose {operation} failed: {result.stderr}",
                "output": result.stderr
            }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "message": f"Docker Compose {operation} timed out after 5 minutes"
        }
    except Exception as e:
        logger.error(f"Docker Compose operation failed: {e}")
        return {
            "success": False,
            "message": f"Docker Compose operation failed: {str(e)}"
        }

def get_docker_compose_services(config_path: str) -> Dict[str, Any]:
    """Get list of services from docker-compose.yml"""
    try:
        # Validate that the path exists
        if not os.path.exists(config_path):
            return {
                "success": False,
                "message": f"Path does not exist: {config_path}. Please check the configuration path."
            }
        
        # Check if docker-compose.yml exists in the path
        compose_file = os.path.join(config_path, "docker-compose.yml")
        if not os.path.exists(compose_file):
            return {
                "success": False,
                "message": f"docker-compose.yml not found in path: {config_path}. Please ensure the file exists."
            }
        
        result = subprocess.run(
            ["docker-compose", "ps", "--format", "json"],
            cwd=config_path,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            # Parse the output to get service information
            services = []
            for line in result.stdout.strip().split('\n'):
                if line:
                    try:
                        import json
                        service_info = json.loads(line)
                        services.append(service_info)
                    except json.JSONDecodeError:
                        continue
            
            return {
                "success": True,
                "services": services
            }
        else:
            return {
                "success": False,
                "message": f"Failed to get services: {result.stderr}"
            }
    except Exception as e:
        logger.error(f"Failed to get Docker Compose services: {e}")
        return {
            "success": False,
            "message": f"Failed to get services: {str(e)}"
        } 