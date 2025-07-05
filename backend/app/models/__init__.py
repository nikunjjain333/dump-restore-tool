from sqlalchemy import Column, Integer, String, Enum, JSON, DateTime
from sqlalchemy.sql import func
from ..database import Base

class DatabaseConfig(Base):
    __tablename__ = "database_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    db_type = Column(String)  # postgres, mysql, etc.
    operation = Column(String)  # dump or restore
    host = Column(String)
    port = Column(Integer)
    username = Column(String)
    password = Column(String)
    database = Column(String)
    dump_path = Column(String)
    restore_path = Column(String, nullable=True)
    additional_params = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class OperationLog(Base):
    __tablename__ = "operation_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    config_id = Column(Integer, index=True)
    operation_type = Column(String)  # dump or restore
    status = Column(String)  # started, completed, failed
    file_path = Column(String, nullable=True)
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
