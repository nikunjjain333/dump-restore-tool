from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import schemas, models
from ..database import get_db

router = APIRouter(
    prefix="/api/configs",
    tags=["configs"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.DatabaseConfig)
def create_config(config: schemas.DatabaseConfigCreate, db: Session = Depends(get_db)):
    """
    Create a new database configuration
    """
    # Check if config with this name already exists
    db_config = db.query(models.DatabaseConfig).filter(
        models.DatabaseConfig.name == config.name
    ).first()
    
    if db_config:
        raise HTTPException(status_code=400, detail="Config with this name already exists")
    
    # Create new config
    db_config = models.DatabaseConfig(**config.dict())
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config

@router.get("/", response_model=List[schemas.DatabaseConfig])
def list_configs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    List all database configurations
    """
    configs = db.query(models.DatabaseConfig).offset(skip).limit(limit).all()
    return configs

@router.get("/{config_id}", response_model=schemas.DatabaseConfig)
def get_config(config_id: int, db: Session = Depends(get_db)):
    """
    Get a specific database configuration by ID
    """
    db_config = db.query(models.DatabaseConfig).filter(
        models.DatabaseConfig.id == config_id
    ).first()
    
    if db_config is None:
        raise HTTPException(status_code=404, detail="Config not found")
    
    return db_config

@router.put("/{config_id}", response_model=schemas.DatabaseConfig)
def update_config(
    config_id: int, 
    config: schemas.DatabaseConfigCreate, 
    db: Session = Depends(get_db)
):
    """
    Update a database configuration
    """
    db_config = db.query(models.DatabaseConfig).filter(
        models.DatabaseConfig.id == config_id
    ).first()
    
    if db_config is None:
        raise HTTPException(status_code=404, detail="Config not found")
    
    # Check if name is being changed to an existing name
    if config.name != db_config.name:
        existing_config = db.query(models.DatabaseConfig).filter(
            models.DatabaseConfig.name == config.name
        ).first()
        if existing_config:
            raise HTTPException(status_code=400, detail="Config with this name already exists")
    
    # Update config
    for key, value in config.dict().items():
        setattr(db_config, key, value)
    
    db.commit()
    db.refresh(db_config)
    return db_config

@router.delete("/{config_id}")
def delete_config(config_id: int, db: Session = Depends(get_db)):
    """
    Delete a database configuration
    """
    db_config = db.query(models.DatabaseConfig).filter(
        models.DatabaseConfig.id == config_id
    ).first()
    
    if db_config is None:
        raise HTTPException(status_code=404, detail="Config not found")
    
    db.delete(db_config)
    db.commit()
    
    return {"message": "Config deleted successfully"}
