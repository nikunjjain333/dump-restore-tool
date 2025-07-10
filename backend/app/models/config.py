from sqlalchemy import Column, Integer, String, JSON # type: ignore
from app.core.db import Base

class Config(Base):
    __tablename__ = "configs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    db_type = Column(String, nullable=False)
    params = Column(JSON, nullable=False)
    run_path = Column(String, nullable=True)  # Working directory for operations
    restore_password = Column(String, nullable=True)  # Optional password for restore operations
    local_database_name = Column(String, nullable=True)  # Optional local database name for restore operations
    dump_file_name = Column(String, nullable=True)  # Custom filename for dump/restore operations
    restore_username = Column(String, nullable=True)  # Optional restore username for restore operations
    restore_host = Column(String, nullable=True)  # Optional restore host for restore operations
    restore_port = Column(String, nullable=True)  # Optional restore port for restore operations
 