from pydantic import BaseModel, Field, validator
from typing import Dict, Any, Optional


# Common validation functions
def validate_db_type(v: str) -> str:
    """Validate database type"""
    allowed_types = ["postgres", "mysql", "mongodb", "redis", "sqlite"]
    if v not in allowed_types:
        raise ValueError(f"Database type must be one of: {allowed_types}")
    return v


def validate_config_name(v: str) -> str:
    """Validate configuration name"""
    if not v:
        raise ValueError("Configuration name cannot be empty")
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
