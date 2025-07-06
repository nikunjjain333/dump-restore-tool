from pydantic import BaseModel
from typing import Dict, Any, Optional, List

class BaseResponse(BaseModel):
    """Base response schema"""
    success: bool
    message: str

class DockerResponse(BaseResponse):
    """Response schema for Docker operations"""
    status: str

class OperationResponse(BaseResponse):
    """Response schema for dump/restore operations"""
    path: Optional[str] = None
    operation_id: Optional[str] = None

class ConfigResponse(BaseModel):
    """Response schema for configuration"""
    id: int
    name: str
    db_type: str
    operation: str
    params: Dict[str, Any]

class ConfigListResponse(BaseModel):
    """Response schema for configuration list"""
    configs: List[ConfigResponse]
    total: int

class HealthResponse(BaseModel):
    """Response schema for health check"""
    status: str
    database: str
    docker: Optional[str] = None
    timestamp: str

class ErrorResponse(BaseModel):
    """Response schema for errors"""
    success: bool = False
    error: str
    details: Optional[str] = None 