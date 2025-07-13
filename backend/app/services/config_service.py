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
    except IntegrityError:
        db.rollback()
        logger.error(f"Configuration with name '{config.name}' already exists")
        raise ValueError(f"Configuration with name '{config.name}' already exists")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create configuration: {e}")
        raise


def update_config(db: Session, config_id: int, config: ConfigCreate):
    """Update an existing configuration in database"""
    try:
        db_config = db.query(Config).filter(Config.id == config_id).first()
        if not db_config:
            return None

        # Check for name conflict (other than self)
        existing = (
            db.query(Config)
            .filter(Config.name == config.name, Config.id != config_id)
            .first()
        )
        if existing:
            raise ValueError(f"Configuration with name '{config.name}' already exists")

        # Update all fields
        for field, value in config.dict().items():
            setattr(db_config, field, value)

        db.commit()
        db.refresh(db_config)
        return db_config
    except ValueError:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update configuration: {e}")
        raise


def delete_config(db: Session, config_id: int):
    """Delete a configuration by ID"""
    try:
        db_config = db.query(Config).filter(Config.id == config_id).first()
        if not db_config:
            return False
        db.delete(db_config)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete configuration: {e}")
        raise
