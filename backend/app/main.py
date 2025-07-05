from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from fastapi.responses import JSONResponse
from enum import Enum

app = FastAPI(
    title="Database Dump & Restore API",
    description="API for managing database dump and restore operations",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Get allowed origins from environment variable or use default
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", 
    "http://localhost:3000,http://localhost:8000"
).split(",")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Add health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Service is running"}

# Add error handling middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal server error: {str(e)}"}
        )

class DatabaseType(str, Enum):
    POSTGRES = "postgres"
    MYSQL = "mysql"

class OperationType(str, Enum):
    DUMP = "dump"
    RESTORE = "restore"

class DatabaseConfig(BaseModel):
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
    additional_params: Optional[dict] = None
    
    class Config:
        from_attributes = True

# In-memory storage (replace with database in production)
configs_db = []

@app.get("/")
async def root():
    return {"message": "Welcome to Database Dump & Restore Tool"}

# Database operations
configs_db = []
last_id = 0

@app.post("/api/configs/")
async def create_config(config: DatabaseConfig):
    global last_id
    last_id += 1
    config_dict = config.dict()
    config_dict["id"] = last_id
    configs_db.append(config_dict)
    return config_dict

@app.get("/api/configs/", response_model=List[DatabaseConfig])
async def list_configs():
    return configs_db

@app.get("/api/configs/{config_id}", response_model=DatabaseConfig)
async def get_config(config_id: int):
    for config in configs_db:
        if config.get("id") == config_id:
            return config
    raise HTTPException(status_code=404, detail="Config not found")

@app.put("/api/configs/{config_id}")
async def update_config(config_id: int, config: DatabaseConfig):
    for i, existing_config in enumerate(configs_db):
        if existing_config.get("id") == config_id:
            updated_config = config.dict()
            updated_config["id"] = config_id
            configs_db[i] = updated_config
            return updated_config
    raise HTTPException(status_code=404, detail="Config not found")

@app.delete("/api/configs/{config_id}")
async def delete_config(config_id: int):
    global configs_db
    initial_length = len(configs_db)
    configs_db = [c for c in configs_db if c.get("id") != config_id]
    if len(configs_db) == initial_length:
        raise HTTPException(status_code=404, detail="Config not found")
    return {"status": "success", "message": "Config deleted"}

# Operation logs
operations_db = []
operation_id = 0

@app.get("/api/operations/")
async def list_operations(config_id: int = None):
    if config_id:
        return [op for op in operations_db if op.get("config_id") == config_id]
    return operations_db

@app.post("/api/operations/dump/{config_id}")
async def execute_dump(config_id: int):
    global operation_id
    # Find the config
    config = next((c for c in configs_db if c.get("id") == config_id), None)
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    # Create operation log
    operation_id += 1
    operation = {
        "id": operation_id,
        "config_id": config_id,
        "operation_type": "dump",
        "status": "started",
        "start_time": "2023-01-01T00:00:00",  # TODO: Use actual timestamp
        "created_at": "2023-01-01T00:00:00"   # TODO: Use actual timestamp
    }
    operations_db.append(operation)
    
    # TODO: Implement actual dump logic
    # This is a placeholder that simulates a successful operation
    operation["status"] = "completed"
    operation["end_time"] = "2023-01-01T00:05:00"  # TODO: Use actual timestamp
    
    return operation

@app.post("/api/operations/restore/{config_id}")
async def execute_restore(config_id: int, file_path: str):
    global operation_id
    # Find the config
    config = next((c for c in configs_db if c.get("id") == config_id), None)
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    # Create operation log
    operation_id += 1
    operation = {
        "id": operation_id,
        "config_id": config_id,
        "operation_type": "restore",
        "status": "started",
        "file_path": file_path,
        "start_time": "2023-01-01T00:00:00",  # TODO: Use actual timestamp
        "created_at": "2023-01-01T00:00:00"   # TODO: Use actual timestamp
    }
    operations_db.append(operation)
    
    # TODO: Implement actual restore logic
    # This is a placeholder that simulates a successful operation
    operation["status"] = "completed"
    operation["end_time"] = "2023-01-01T00:05:00"  # TODO: Use actual timestamp
    
    return operation

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
