from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.config import ConfigCreate, ConfigOut
from app.services.config_service import get_configs, create_config, update_config
from app.core.db import get_db

router = APIRouter()


@router.get("/", response_model=list[ConfigOut])
def list_configs(db: Session = Depends(get_db)):
    """Get all saved configurations"""
    try:
        return get_configs(db)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch configurations: {str(e)}"
        )


@router.post("/", response_model=ConfigOut)
def add_config(config: ConfigCreate, db: Session = Depends(get_db)):
    """Create a new configuration"""
    try:
        return create_config(db, config)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create configuration: {str(e)}"
        )


@router.put("/{config_id}", response_model=ConfigOut)
def update_config_endpoint(
    config_id: int, config: ConfigCreate, db: Session = Depends(get_db)
):
    """Update an existing configuration"""
    try:
        updated = update_config(db, config_id, config)
        if not updated:
            raise HTTPException(status_code=404, detail="Configuration not found")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update configuration: {str(e)}"
        )


@router.delete("/{config_id}")
def delete_config_endpoint(config_id: int, db: Session = Depends(get_db)):
    """Delete a configuration by ID"""
    try:
        from app.services.config_service import delete_config

        deleted = delete_config(db, config_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Configuration not found")
        return {"success": True, "message": "Configuration deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete configuration: {str(e)}"
        )
