from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.docker_compose import (
    DockerComposeConfigCreate,
    DockerComposeConfigOut,
    DockerComposeConfigUpdate,
    DockerComposeOperationRequest,
    DockerComposeOperationResponse,
)
from app.services.docker_compose_service import (
    get_docker_compose_configs,
    get_docker_compose_config,
    create_docker_compose_config,
    update_docker_compose_config,
    delete_docker_compose_config,
    run_docker_compose_operation,
    get_docker_compose_services,
)
from app.core.db import get_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=list[DockerComposeConfigOut])
def list_docker_compose_configs(db: Session = Depends(get_db)):
    """Get all Docker Compose configurations"""
    try:
        return get_docker_compose_configs(db)
    except Exception as e:
        logger.error(f"Failed to fetch Docker Compose configurations: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch configurations: {str(e)}"
        )


@router.get("/{config_id}", response_model=DockerComposeConfigOut)
def get_docker_compose_config_endpoint(config_id: int, db: Session = Depends(get_db)):
    """Get a specific Docker Compose configuration"""
    try:
        config = get_docker_compose_config(db, config_id)
        if not config:
            raise HTTPException(status_code=404, detail="Configuration not found")
        return config
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch Docker Compose configuration {config_id}: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch configuration: {str(e)}"
        )


@router.post("/", response_model=DockerComposeConfigOut)
def add_docker_compose_config(
    config: DockerComposeConfigCreate, db: Session = Depends(get_db)
):
    """Create a new Docker Compose configuration"""
    try:
        return create_docker_compose_config(db, config)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create Docker Compose configuration: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create configuration: {str(e)}"
        )


@router.put("/{config_id}", response_model=DockerComposeConfigOut)
def update_docker_compose_config_endpoint(
    config_id: int,
    config_update: DockerComposeConfigUpdate,
    db: Session = Depends(get_db),
):
    """Update a Docker Compose configuration"""
    try:
        config = update_docker_compose_config(db, config_id, config_update)
        if not config:
            raise HTTPException(status_code=404, detail="Configuration not found")
        return config
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update Docker Compose configuration {config_id}: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to update configuration: {str(e)}"
        )


@router.delete("/{config_id}")
def delete_docker_compose_config_endpoint(
    config_id: int, db: Session = Depends(get_db)
):
    """Delete a Docker Compose configuration"""
    try:
        success = delete_docker_compose_config(db, config_id)
        if not success:
            raise HTTPException(status_code=404, detail="Configuration not found")
        return {"success": True, "message": "Configuration deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete Docker Compose configuration {config_id}: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to delete configuration: {str(e)}"
        )


@router.post("/{config_id}/operate", response_model=DockerComposeOperationResponse)
def operate_docker_compose(
    config_id: int,
    operation_request: DockerComposeOperationRequest,
    db: Session = Depends(get_db),
):
    """Perform Docker Compose operation (up, down, restart, etc.)"""
    try:
        # Use the service name and flags from the request, or fall back to config defaults
        service_name = operation_request.service_name
        flags = operation_request.flags

        result = run_docker_compose_operation(
            db, config_id, operation_request.operation, service_name, flags
        )

        if result["success"]:
            return DockerComposeOperationResponse(
                success=True, message=result["message"], output=result.get("output")
            )
        else:
            return DockerComposeOperationResponse(
                success=False, message=result["message"], output=result.get("output")
            )
    except Exception as e:
        logger.error(f"Failed to perform Docker Compose operation: {e}")
        raise HTTPException(status_code=500, detail=f"Operation failed: {str(e)}")


@router.get("/{config_id}/services")
def get_services(config_id: int, db: Session = Depends(get_db)):
    """Get services status for a Docker Compose configuration"""
    try:
        config = get_docker_compose_config(db, config_id)
        if not config:
            raise HTTPException(status_code=404, detail="Configuration not found")

        result = get_docker_compose_services(config.path)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get services for config {config_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get services: {str(e)}")
