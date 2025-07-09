from fastapi import APIRouter, HTTPException
from app.schemas.requests import DumpRequest
from app.services.dump_service import run_dump
from fastapi import Query
import os

router = APIRouter()

@router.post("/")
def run_dump_endpoint(request: DumpRequest):
    """Start database dump operation"""
    result = run_dump(request.db_type, request.params, request.config_name, request.run_path, request.dump_file_name)
    
    if result["success"]:
        return {
            "success": True,
            "message": result["message"],
            "path": result.get("path")
        }
    else:
        raise HTTPException(status_code=500, detail=result["message"]) 