from pydantic import BaseModel
from typing import Any, Dict, Optional

class ConfigBase(BaseModel):
    name: str
    db_type: str
    params: Dict[str, Any]
    run_path: Optional[str] = None

class ConfigCreate(ConfigBase):
    pass

class ConfigOut(ConfigBase):
    id: int
    class Config:
        from_attributes = True 