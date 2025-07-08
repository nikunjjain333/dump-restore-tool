from fastapi import APIRouter, HTTPException
from app.schemas.requests import RestoreRequest
from app.services.restore_service import run_restore

router = APIRouter()

@router.post("/")
def run_restore_endpoint(request: RestoreRequest):
    """Start database restore operation"""
    result = run_restore(
        request.db_type, 
        request.params, 
        request.path,
        request.restore_password,
        request.run_path,
        request.local_database_name
    )
    
    if result["success"]:
        return {
            "success": True,
            "message": result["message"],
            "path": result.get("path")
        }
    else:
        raise HTTPException(status_code=500, detail=result["message"]) 