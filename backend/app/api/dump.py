from fastapi import APIRouter, HTTPException
from app.schemas.requests import DumpRequest
from app.services.dump_service import run_dump

router = APIRouter()

@router.post("/")
def run_dump_endpoint(request: DumpRequest):
    """Start database dump operation"""
    result = run_dump(request.db_type, request.params, request.path, request.run_path)
    
    if result["success"]:
        return {
            "success": True,
            "message": result["message"],
            "path": result.get("path")
        }
    else:
        raise HTTPException(status_code=500, detail=result["message"]) 