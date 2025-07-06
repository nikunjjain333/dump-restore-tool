from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.config import Config
from app.schemas.config import ConfigCreate
import logging

logger = logging.getLogger(__name__)

def get_configs(db: Session):
    """Get all configurations from database"""
    try:
        return db.query(Config).all()
    except Exception as e:
        logger.error(f"Failed to fetch configurations: {e}")
        raise

def create_config(db: Session, config: ConfigCreate):
    """Create a new configuration in database"""
    try:
        db_config = Config(**config.dict())
        db.add(db_config)
        db.commit()
        db.refresh(db_config)
        return db_config
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Configuration with name '{config.name}' already exists: {e}")
        raise ValueError(f"Configuration with name '{config.name}' already exists")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create configuration: {e}")
        raise 