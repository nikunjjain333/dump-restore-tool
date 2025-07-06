from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class DatabaseType(str, Enum):
    POSTGRES = "postgres"
    MYSQL = "mysql"

class OperationType(str, Enum):
    DUMP = "dump"
    RESTORE = "restore"

class DatabaseConfigBase(BaseModel):
    name: str
    db_type: DatabaseType
    operation: OperationType
    host: str
    port: int
    username: str
    password: str
    database: str
    dump_path: str
    restore_path: Optional[str] = None
    filename: Optional[str] = None  # Default filename for dumps
    additional_params: Optional[Dict[str, Any]] = None

class DatabaseConfigCreate(DatabaseConfigBase):
    pass

class DatabaseConfig(DatabaseConfigBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class OperationLogBase(BaseModel):
    config_id: int
    operation_type: str
    status: str
    file_path: Optional[str] = None
    error_message: Optional[str] = None

class OperationLog(OperationLogBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# New schema for dump operation with filename
class DumpRequest(BaseModel):
    filename: Optional[str] = None
