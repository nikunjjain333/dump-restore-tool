from pydantic import BaseModel, Field, validator # type: ignore
from typing import Dict, Any, Optional

class DockerStartRequest(BaseModel):
    """Request schema for starting Docker daemon"""
    force: bool = Field(default=False, description="Force restart if already running")

class DumpRequest(BaseModel):
    """Request schema for database dump operation"""
    db_type: str = Field(..., description="Database type (postgres, mysql, mongodb, redis, sqlite)")
    params: Dict[str, Any] = Field(..., description="Database connection parameters")
    config_name: str = Field(..., description="Configuration name for consistent file paths")
    run_path: Optional[str] = Field(default=None, description="Working directory for the operation (optional)")
    dump_file_name: Optional[str] = Field(default=None, description="Custom filename for dump file (without extension)")
    
    @validator('db_type')
    def validate_db_type(cls, v):
        allowed_types = ['postgres', 'mysql', 'mongodb', 'redis', 'sqlite']
        if v not in allowed_types:
            raise ValueError(f'Database type must be one of: {allowed_types}')
        return v
    
    @validator('config_name')
    def validate_config_name(cls, v):
        if not v:
            raise ValueError('Configuration name cannot be empty')
        return v

class RestoreRequest(BaseModel):
    """Request schema for database restore operation"""
    db_type: str = Field(..., description="Database type (postgres, mysql, mongodb, redis, sqlite)")
    params: Dict[str, Any] = Field(..., description="Database connection parameters")
    config_name: str = Field(..., description="Configuration name for consistent file paths")
    run_path: Optional[str] = Field(default=None, description="Working directory for the operation (optional)")
    restore_password: str = Field(..., description="Required password for restore operations")
    local_database_name: Optional[str] = Field(default=None, description="Optional local database name for restore operations")
    dump_file_name: Optional[str] = Field(default=None, description="Custom filename for dump file (without extension)")
    restore_username: Optional[str] = Field(default=None, description="Optional restore username for restore operations")
    
    @validator('db_type')
    def validate_db_type(cls, v):
        allowed_types = ['postgres', 'mysql', 'mongodb', 'redis', 'sqlite']
        if v not in allowed_types:
            raise ValueError(f'Database type must be one of: {allowed_types}')
        return v
    
    @validator('config_name')
    def validate_config_name(cls, v):
        if not v:
            raise ValueError('Configuration name cannot be empty')
        return v

class ConfigCreateRequest(BaseModel):
    """Request schema for creating configuration"""
    name: str = Field(..., min_length=3, max_length=100, description="Configuration name")
    db_type: str = Field(..., description="Database type")
    operation: str = Field(..., description="Operation type (dump or restore)")
    params: Dict[str, Any] = Field(..., description="Configuration parameters")
    
    @validator('operation')
    def validate_operation(cls, v):
        if v not in ['dump', 'restore']:
            raise ValueError('Operation must be either "dump" or "restore"')
        return v 