from pydantic import BaseModel, Field # type: ignore
from typing import Any, Dict, Optional

class ConfigBase(BaseModel):
    name: str
    db_type: str
    params: Dict[str, Any]
    run_path: Optional[str] = None
    restore_password: Optional[str] = Field(None, description="Optional password for restore operations")
    local_database_name: Optional[str] = None
    dump_file_name: Optional[str] = Field(None, description="Custom filename for dump/restore operations (without extension)")
    restore_username: Optional[str] = Field(None, description="Optional restore username for restore operations")
    restore_host: Optional[str] = Field(None, description="Optional restore host for restore operations")
    restore_port: Optional[str] = Field(None, description="Optional restore port for restore operations")


class ConfigCreate(ConfigBase):
    pass

class ConfigOut(ConfigBase):
    id: int
    class Config:
        from_attributes = True 