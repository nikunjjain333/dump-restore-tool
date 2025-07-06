from pydantic import BaseModel
from typing import Any, Dict

class ConfigBase(BaseModel):
    name: str
    db_type: str
    operation: str
    params: Dict[str, Any]

class ConfigCreate(ConfigBase):
    pass

class ConfigOut(ConfigBase):
    id: int
    class Config:
        from_attributes = True 