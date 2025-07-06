from sqlalchemy import Column, Integer, String, JSON, Boolean
from app.core.db import Base

class DockerComposeConfig(Base):
    __tablename__ = "docker_compose_configs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    path = Column(String, nullable=False)
    service_name = Column(String, nullable=True)  # Optional service name for targeted operations
    flags = Column(JSON, nullable=True)  # Store additional flags as JSON
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True) 