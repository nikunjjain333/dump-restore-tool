from pydantic import BaseModel, Field, validator  # type: ignore
from typing import Any, Dict, Optional
from app.core.validators import (
    validate_string_length,
    validate_alphanumeric_with_special,
    validate_no_path_traversal,
    validate_db_params,
    sanitize_filename,
    validate_database_name
)


class ConfigBase(BaseModel):
    name: str
    db_type: str
    params: Dict[str, Any]
    restore_password: Optional[str] = Field(
        None, description="Optional password for restore operations"
    )
    local_database_name: Optional[str] = None
    dump_file_name: Optional[str] = Field(
        None,
        description="Custom filename for dump/restore operations (without extension)",
    )
    restore_username: Optional[str] = Field(
        None, description="Optional restore username for restore operations"
    )
    restore_host: Optional[str] = Field(
        None, description="Optional restore host for restore operations"
    )
    restore_port: Optional[str] = Field(
        None, description="Optional restore port for restore operations"
    )
    stack_name: Optional[str] = Field(
        None,
        description="Optional Docker Compose stack name for containerized restore operations",
    )


class ConfigCreate(ConfigBase):
    @validator('name')
    def validate_name(cls, v):
        """Validate configuration name"""
        v = validate_string_length(v, 1, 100)
        v = validate_alphanumeric_with_special(v, "_-")
        v = validate_no_path_traversal(v)
        return v
    
    @validator('db_type')
    def validate_db_type(cls, v):
        """Validate database type"""
        allowed_types = ["postgres", "mysql", "mongodb", "redis", "sqlite"]
        v = validate_string_length(v, 1, 20)
        if v not in allowed_types:
            raise ValueError(f"Database type must be one of: {allowed_types}")
        return v
    
    @validator('params')
    def validate_params(cls, v, values):
        """Validate database parameters"""
        db_type = values.get('db_type')
        if db_type:
            return validate_db_params(db_type, v)
        return v
    
    @validator('dump_file_name')
    def validate_dump_filename(cls, v):
        """Validate and sanitize dump filename"""
        if v:
            v = validate_string_length(v, 1, 200)
            v = sanitize_filename(v)
            validate_no_path_traversal(v)
        return v
    
    @validator('local_database_name')
    def validate_local_db_name(cls, v):
        """Validate local database name"""
        if v:
            v = validate_database_name(str(v))
        return v


class ConfigOut(ConfigBase):
    id: int

    class Config:
        from_attributes = True
