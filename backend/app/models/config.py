from sqlalchemy import Column, Integer, String, JSON
from app.core.db import Base

class Config(Base):
    __tablename__ = "configs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    db_type = Column(String, nullable=False)
    operation = Column(String, nullable=False)  # dump or restore
    params = Column(JSON, nullable=False)
    dump_path = Column(String, nullable=True)  # Path for dump operations
    restore_path = Column(String, nullable=True)  # Path for restore operations
    run_path = Column(String, nullable=True)  # Working directory for operations 