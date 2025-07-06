from pydantic import BaseModel, Field, validator
from typing import Any, Dict, Optional, List

class DockerComposeConfigBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100, description="Configuration name")
    path: str = Field(..., description="Path to docker-compose.yml file")
    service_name: Optional[str] = Field(None, description="Optional service name for targeted operations")
    flags: Optional[Dict[str, Any]] = Field(None, description="Additional Docker Compose flags")
    description: Optional[str] = Field(None, description="Configuration description")

class DockerComposeConfigCreate(DockerComposeConfigBase):
    pass

class DockerComposeConfigUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    path: Optional[str] = Field(None)
    service_name: Optional[str] = Field(None)
    flags: Optional[Dict[str, Any]] = Field(None)
    description: Optional[str] = Field(None)
    is_active: Optional[bool] = Field(None)

class DockerComposeConfigOut(DockerComposeConfigBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True

class DockerComposeOperationRequest(BaseModel):
    service_name: Optional[str] = Field(None, description="Override service name")
    flags: Optional[Dict[str, Any]] = Field(None, description="Override flags")
    operation: str = Field(..., description="Operation to perform (up, down, restart, logs, ps)")

    @validator('operation')
    def validate_operation(cls, v):
        allowed_operations = ['up', 'down', 'restart', 'logs', 'ps', 'build', 'pull']
        if v not in allowed_operations:
            raise ValueError(f'Operation must be one of: {allowed_operations}')
        return v

class DockerComposeOperationResponse(BaseModel):
    success: bool
    message: str
    output: Optional[str] = None
    services: Optional[List[Dict[str, Any]]] = None 