from pydantic import BaseModel, Field, validator
from typing import Dict, Any, Optional
from app.core.validators import (
    validate_string_length,
    validate_alphanumeric_with_special,
    validate_no_path_traversal,
    validate_db_params,
    sanitize_filename
)


# Common validation functions
def validate_db_type(v: str) -> str:
    """Validate database type"""
    allowed_types = ["postgres", "mysql", "mongodb", "redis", "sqlite"]
    v = validate_string_length(v, 1, 20)
    if v not in allowed_types:
        raise ValueError(f"Database type must be one of: {allowed_types}")
    return v


def validate_config_name(v: str) -> str:
    """Validate configuration name"""
    v = validate_string_length(v, 1, 100)
    v = validate_alphanumeric_with_special(v, "_-")
    v = validate_no_path_traversal(v)
    return v


class DumpRequest(BaseModel):
    """Request schema for database dump operation
    Note: The 'database' field in params is now optional for all db types."""

    db_type: str = Field(
        ..., description="Database type (postgres, mysql, mongodb, redis, sqlite)"
    )
    params: Dict[str, Any] = Field(
        ..., description="Database connection parameters (database is optional)"
    )
    config_name: str = Field(
        ..., description="Configuration name for consistent file paths"
    )
    dump_file_name: Optional[str] = Field(
        default=None, description="Custom filename for dump file (without extension)"
    )

    _validate_db_type = validator("db_type", allow_reuse=True)(validate_db_type)
    _validate_config_name = validator("config_name", allow_reuse=True)(
        validate_config_name
    )
    
    @validator("params")
    def validate_params(cls, v, values):
        """Validate database parameters"""
        db_type = values.get("db_type")
        if db_type:
            return validate_db_params(db_type, v)
        return v
    
    @validator("dump_file_name")
    def validate_dump_filename(cls, v):
        """Validate and sanitize dump filename"""
        if v:
            v = validate_string_length(v, 1, 200)
            v = sanitize_filename(v)
            validate_no_path_traversal(v)
        return v


class RestoreRequest(BaseModel):
    """Request schema for database restore operation
    Note: The 'database' field in params is now optional for all db types."""

    db_type: str = Field(
        ..., description="Database type (postgres, mysql, mongodb, redis, sqlite)"
    )
    params: Dict[str, Any] = Field(
        ..., description="Database connection parameters (database is optional)"
    )
    config_name: str = Field(
        ..., description="Configuration name for consistent file paths"
    )
    restore_password: Optional[str] = Field(
        default=None, description="Optional password for restore operations"
    )
    local_database_name: Optional[str] = Field(
        default=None, description="Optional local database name for restore operations"
    )
    dump_file_name: Optional[str] = Field(
        default=None, description="Custom filename for dump file (without extension)"
    )
    restore_username: Optional[str] = Field(
        default=None, description="Optional restore username for restore operations"
    )
    restore_host: Optional[str] = Field(
        default=None, description="Optional restore host for restore operations"
    )
    restore_port: Optional[str] = Field(
        default=None, description="Optional restore port for restore operations"
    )
    stack_name: Optional[str] = Field(
        default=None,
        description="Optional Docker Compose stack name for containerized restore operations",
    )

    _validate_db_type = validator("db_type", allow_reuse=True)(validate_db_type)
    _validate_config_name = validator("config_name", allow_reuse=True)(
        validate_config_name
    )
    
    @validator("params")
    def validate_restore_params(cls, v, values):
        """Validate database parameters"""
        db_type = values.get("db_type")
        if db_type:
            return validate_db_params(db_type, v)
        return v
    
    @validator("dump_file_name")
    def validate_restore_dump_filename(cls, v):
        """Validate and sanitize dump filename"""
        if v:
            v = validate_string_length(v, 1, 200)
            v = sanitize_filename(v)
            validate_no_path_traversal(v)
        return v
    
    @validator("restore_password")
    def validate_restore_password(cls, v):
        """Validate restore password"""
        if v:
            v = validate_string_length(v, 1, 128)
        return v
    
    @validator("local_database_name")
    def validate_local_db_name(cls, v):
        """Validate local database name"""
        if v:
            from app.core.validators import validate_database_name
            v = validate_database_name(str(v))
        return v
