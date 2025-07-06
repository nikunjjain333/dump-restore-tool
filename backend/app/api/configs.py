from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.config import ConfigCreate, ConfigOut
from app.services.config_service import get_configs, create_config
from app.core.db import get_db

router = APIRouter()

@router.get("/", response_model=list[ConfigOut])
def list_configs(db: Session = Depends(get_db)):
    """Get all saved configurations"""
    try:
        return get_configs(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch configurations: {str(e)}")

@router.post("/", response_model=ConfigOut)
def add_config(config: ConfigCreate, db: Session = Depends(get_db)):
    """Create a new configuration"""
    try:
        return create_config(db, config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create configuration: {str(e)}") 