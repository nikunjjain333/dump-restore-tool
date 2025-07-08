from pydantic import BaseModel, Field
from typing import Any, Dict, Optional

class ConfigBase(BaseModel):
    name: str
    db_type: str
    params: Dict[str, Any]
    run_path: Optional[str] = None
    restore_password: str = Field(..., description="Required password for restore operations")
    local_database_name: Optional[str] = None

class ConfigCreate(ConfigBase):
    pass

class ConfigOut(ConfigBase):
    id: int
    class Config:
        from_attributes = True 