from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime

from .. import schemas, models
from ..database import get_db
from ..services.database_service import DatabaseService

router = APIRouter(
    prefix="/api/operations",
    tags=["operations"],
    responses={404: {"description": "Not found"}},
)

def log_operation(
    db: Session, 
    config_id: int, 
    operation_type: str, 
    status: str,
    file_path: str = None,
    error_message: str = None
):
    """
    Log an operation to the database
    """
    log = models.OperationLog(
        config_id=config_id,
        operation_type=operation_type,
        status=status,
        file_path=file_path,
        error_message=error_message
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

def execute_dump_async(db: Session, config_id: int):
    """
    Execute a database dump asynchronously
    """
    try:
        # Get the config
        db_config = db.query(models.DatabaseConfig).get(config_id)
        if not db_config:
            raise ValueError(f"Config with ID {config_id} not found")
        
        # Log start
        log_operation(
            db=db,
            config_id=config_id,
            operation_type="dump",
            status="started"
        )
        
        # Prepare config for dump
        config_dict = {
            'db_type': db_config.db_type,
            'host': db_config.host,
            'port': db_config.port,
            'username': db_config.username,
            'password': db_config.password,
            'database': db_config.database,
            'dump_path': db_config.dump_path
        }
        
        # Execute dump
        result = DatabaseService.create_dump(config_dict)
        
        # Log result
        if result['success']:
            log_operation(
                db=db,
                config_id=config_id,
                operation_type="dump",
                status="completed",
                file_path=result.get('file_path')
            )
        else:
            log_operation(
                db=db,
                config_id=config_id,
                operation_type="dump",
                status="failed",
                error_message=result.get('error')
            )
            
    except Exception as e:
        # Log any unexpected errors
        log_operation(
            db=db,
            config_id=config_id,
            operation_type="dump",
            status="failed",
            error_message=str(e)
        )

def execute_restore_async(db: Session, config_id: int, dump_file: str):
    """
    Execute a database restore asynchronously
    """
    try:
        # Get the config
        db_config = db.query(models.DatabaseConfig).get(config_id)
        if not db_config:
            raise ValueError(f"Config with ID {config_id} not found")
        
        # Log start
        log_operation(
            db=db,
            config_id=config_id,
            operation_type="restore",
            status="started",
            file_path=dump_file
        )
        
        # Prepare config for restore
        config_dict = {
            'db_type': db_config.db_type,
            'host': db_config.host,
            'port': db_config.port,
            'username': db_config.username,
            'password': db_config.password,
            'database': db_config.database,
            'restore_path': db_config.restore_path or db_config.dump_path
        }
        
        # Execute restore
        result = DatabaseService.restore_dump(config_dict, dump_file)
        
        # Log result
        if result['success']:
            log_operation(
                db=db,
                config_id=config_id,
                operation_type="restore",
                status="completed",
                file_path=dump_file
            )
        else:
            log_operation(
                db=db,
                config_id=config_id,
                operation_type="restore",
                status="failed",
                file_path=dump_file,
                error_message=result.get('error')
            )
            
    except Exception as e:
        # Log any unexpected errors
        log_operation(
            db=db,
            config_id=config_id,
            operation_type="restore",
            status="failed",
            file_path=dump_file,
            error_message=str(e)
        )

@router.post("/dump/{config_id}")
async def trigger_dump(
    config_id: int, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Trigger a database dump for a specific configuration
    """
    # Verify config exists
    db_config = db.query(models.DatabaseConfig).get(config_id)
    if not db_config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    # Add to background tasks
    background_tasks.add_task(execute_dump_async, db, config_id)
    
    return {"message": "Dump operation started in the background"}

@router.post("/restore/{config_id}")
async def trigger_restore(
    config_id: int,
    dump_file: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Trigger a database restore for a specific configuration
    """
    # Verify config exists
    db_config = db.query(models.DatabaseConfig).get(config_id)
    if not db_config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    # Add to background tasks
    background_tasks.add_task(execute_restore_async, db, config_id, dump_file)
    
    return {"message": "Restore operation started in the background"}

@router.get("/logs/{config_id}")
async def get_operation_logs(
    config_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get operation logs for a specific configuration
    """
    # Verify config exists
    db_config = db.query(models.DatabaseConfig).get(config_id)
    if not db_config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    # Get logs
    logs = db.query(models.OperationLog).filter(
        models.OperationLog.config_id == config_id
    ).order_by(
        models.OperationLog.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return logs
