from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status, Response
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
from datetime import datetime
import os
import uuid
import logging

from .. import schemas, models
from ..database import get_db
from ..services.database_service import DatabaseService

logger = logging.getLogger(__name__)

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
    error_message: str = None,
    operation_id: str = None,
    metadata: Dict[str, Any] = None
) -> models.OperationLog:
    """
    Log an operation to the database
    """
    try:
        log = models.OperationLog(
            operation_id=operation_id or str(uuid.uuid4()),
            config_id=config_id,
            operation_type=operation_type,
            status=status,
            file_path=file_path,
            error_message=error_message,
            metadata=metadata or {}
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
    except Exception as e:
        logger.error(f"Error logging operation: {e}")
        db.rollback()
        raise

async def execute_dump_async(db: Session, config_id: int, operation_id: str, custom_filename: Optional[str] = None):
    """
    Execute a database dump asynchronously
    """
    try:
        # Get the config
        db_config = db.query(models.DatabaseConfig).get(config_id)
        if not db_config:
            raise ValueError(f"Config with ID {config_id} not found")
        
        # Convert DB model to dict for the service
        config = {
            "db_type": db_config.db_type,
            "host": db_config.host,
            "port": db_config.port,
            "username": db_config.username,
            "password": db_config.password,
            "database": db_config.database,
            "format": "custom",  # Use custom format for better compression
            "dump_path": os.path.expanduser("~/dumps")  # Store dumps in ~/dumps
        }
        
        # Log start
        operation_log = log_operation(
            db=db,
            config_id=config_id,
            operation_type="dump",
            status="started",
            operation_id=operation_id,
            metadata={
                "config": {
                    "host": db_config.host,
                    "port": db_config.port,
                    "database": db_config.database
                },
                "start_time": datetime.utcnow().isoformat()
            }
        )
        
        # Use custom filename if provided, otherwise use the one from config
        final_filename = custom_filename or db_config.filename
        
        # Execute the dump
        result = DatabaseService.create_dump(config, operation_id=operation_id, custom_filename=final_filename)
        
        if result['success']:
            # Update operation log with success
            operation_log.status = "completed"
            operation_log.file_path = result.get('dump_file')
            operation_log.metadata.update({
                "end_time": datetime.utcnow().isoformat(),
                "file_size": os.path.getsize(result['dump_file']),
                "duration_seconds": (datetime.utcnow() - operation_log.created_at).total_seconds()
            })
            db.commit()
            
            logger.info(f"Successfully created dump: {result['dump_file']}")
        else:
            # Update operation log with failure
            error_msg = result.get('error', 'Unknown error')
            operation_log.status = "failed"
            operation_log.error_message = error_msg
            operation_log.metadata.update({
                "end_time": datetime.utcnow().isoformat(),
                "error": error_msg
            })
            db.commit()
            
            logger.error(f"Dump failed: {error_msg}")
            
    except Exception as e:
        logger.exception(f"Error in async dump: {e}")
        
        # Update operation log with error
        try:
            if 'operation_log' in locals():
                operation_log.status = "failed"
                operation_log.error_message = str(e)
                operation_log.metadata.update({
                    "end_time": datetime.utcnow().isoformat(),
                    "error": str(e)
                })
                db.commit()
        except Exception as log_error:
            logger.error(f"Error updating operation log: {log_error}")
            db.rollback()

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

@router.get("/")
async def list_operations(
    config_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    List all operations with optional filtering by config_id
    """
    query = db.query(models.OperationLog)
    
    if config_id:
        query = query.filter(models.OperationLog.config_id == config_id)
    
    operations = query.order_by(
        models.OperationLog.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return [
        {
            "id": op.id,
            "config_id": op.config_id,
            "operation_type": op.operation_type,
            "status": op.status,
            "file_path": op.file_path,
            "error_message": op.error_message,
            "created_at": op.created_at.isoformat(),
            "updated_at": op.updated_at.isoformat() if op.updated_at else None,
            "metadata": op.metadata or {}
        }
        for op in operations
    ]

@router.get("/{operation_id}/status")
async def get_operation_status(
    operation_id: str,
    db: Session = Depends(get_db)
):
    """
    Get the status of a dump operation
    """
    # Try to get status from the database first
    operation_log = db.query(models.OperationLog).filter(
        models.OperationLog.operation_id == operation_id
    ).first()
    
    if not operation_log:
        raise HTTPException(status_code=404, detail="Operation not found")
    
    # Get live status from the service if available
    status_info = DatabaseService.get_dump_status(operation_id)
    
    # If the operation is complete, update the database
    if status_info and status_info.get('status') in ['completed', 'failed', 'cancelled']:
        if operation_log.status != status_info['status']:
            operation_log.status = status_info['status']
            operation_log.error_message = status_info.get('error')
            operation_log.updated_at = datetime.utcnow()
            
            if status_info.get('dump_file'):
                operation_log.file_path = status_info['dump_file']
                
            if 'file_size' in status_info:
                operation_log.metadata = operation_log.metadata or {}
                operation_log.metadata['file_size'] = status_info['file_size']
            
            db.commit()
    
    # Prepare response
    response = {
        "operation_id": operation_log.operation_id,
        "status": operation_log.status,
        "type": operation_log.operation_type,
        "config_id": operation_log.config_id,
        "created_at": operation_log.created_at.isoformat(),
        "updated_at": operation_log.updated_at.isoformat() if operation_log.updated_at else None,
        "error": operation_log.error_message,
        "file_path": operation_log.file_path,
        "metadata": operation_log.metadata or {}
    }
    
    # Add live status info if available
    if status_info:
        response.update({
            "progress": status_info.get('progress', 0),
            "output": status_info.get('output', []),
            "start_time": status_info.get('start_time'),
            "last_update": status_info.get('last_update'),
            "file_size": status_info.get('file_size')
        })
    
    return response

@router.post("/{config_id}/dump", status_code=status.HTTP_202_ACCEPTED)
async def trigger_dump(
    config_id: int, 
    dump_request: schemas.DumpRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Trigger a database dump for a specific configuration
    """
    # Check if config exists
    db_config = db.query(models.DatabaseConfig).get(config_id)
    if not db_config:
        raise HTTPException(status_code=404, detail="Database configuration not found")
    
    # Generate a unique operation ID
    operation_id = str(uuid.uuid4())
    
    # Add the dump task to background tasks
    background_tasks.add_task(execute_dump_async, db, config_id, operation_id, dump_request.filename)
    
    # Return the operation ID for status checking
    return {
        "message": "Dump operation started in the background",
        "operation_id": operation_id,
        "status_url": f"/api/operations/{operation_id}/status"
    }

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

@router.get("/{operation_id}/download")
async def download_dump(
    operation_id: str,
    db: Session = Depends(get_db)
):
    """
    Download a completed database dump
    """
    # Get the operation log
    operation_log = db.query(models.OperationLog).filter(
        models.OperationLog.operation_id == operation_id,
        models.OperationLog.operation_type == "dump",
        models.OperationLog.status == "completed"
    ).first()
    
    if not operation_log or not operation_log.file_path:
        raise HTTPException(status_code=404, detail="Dump file not found or not completed")
    
    # Verify the file exists
    if not os.path.exists(operation_log.file_path):
        raise HTTPException(status_code=404, detail="Dump file not found on server")
    
    # Generate a nice filename
    db_name = operation_log.metadata.get('config', {}).get('database', 'dump')
    timestamp = operation_log.created_at.strftime("%Y%m%d_%H%M%S")
    filename = f"{db_name}_{timestamp}.dump"
    
    # Return the file for download
    return FileResponse(
        path=operation_log.file_path,
        filename=filename,
        media_type='application/octet-stream',
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/{operation_id}/cancel", status_code=status.HTTP_202_ACCEPTED)
async def cancel_operation(
    operation_id: str,
    db: Session = Depends(get_db)
):
    """
    Cancel a running operation
    """
    # Try to cancel the operation in the service
    if not DatabaseService.cancel_dump(operation_id):
        raise HTTPException(status_code=404, detail="Operation not found or not cancellable")
    
    # Update the operation log
    operation_log = db.query(models.OperationLog).filter(
        models.OperationLog.operation_id == operation_id
    ).first()
    
    if operation_log:
        operation_log.status = "cancelled"
        operation_log.updated_at = datetime.utcnow()
        operation_log.metadata = operation_log.metadata or {}
        operation_log.metadata['cancelled_at'] = datetime.utcnow().isoformat()
        db.commit()
    
    return {"message": "Operation cancellation requested"}

@router.get("/config/{config_id}/logs")
async def get_operation_logs(
    config_id: int,
    operation_type: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get operation logs for a specific configuration
    """
    # Check if config exists
    db_config = db.query(models.DatabaseConfig).get(config_id)
    if not db_config:
        raise HTTPException(status_code=404, detail="Database configuration not found")
    
    # Build query
    query = db.query(models.OperationLog).filter(
        models.OperationLog.config_id == config_id
    )
    
    # Apply filters
    if operation_type:
        query = query.filter(models.OperationLog.operation_type == operation_type)
    if status:
        query = query.filter(models.OperationLog.status == status)
    
    # Get total count for pagination
    total = query.count()
    
    # Get paginated results
    logs = query.order_by(
        models.OperationLog.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    # Format response
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": [
            {
                "operation_id": log.operation_id,
                "operation_type": log.operation_type,
                "status": log.status,
                "created_at": log.created_at.isoformat(),
                "updated_at": log.updated_at.isoformat() if log.updated_at else None,
                "error": log.error_message,
                "file_path": log.file_path,
                "file_size": (log.metadata or {}).get('file_size') if log.file_path else None,
                "metadata": log.metadata or {}
            }
            for log in logs
        ]
    }
