from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.api import configs, dump, restore, docker, docker_compose
from app.core.db import engine, Base
from sqlalchemy import text
import logging
import asyncio

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

app = FastAPI(
    title="Database Dump & Restore Tool API",
    description="A comprehensive API for database dump and restore operations",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def wait_for_db(max_retries=30, delay=2):
    """Wait for database to be ready with retry mechanism"""
    for attempt in range(max_retries):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logging.info("Database connection successful")
            return True
        except Exception as e:
            logging.warning(f"Database connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(delay)
            else:
                logging.error("Max retries reached, database connection failed")
                return False


@app.on_event("startup")
async def on_startup():
    """Initialize database tables on startup with retry mechanism"""
    logging.info("Starting application...")

    # Wait for database to be ready
    db_ready = await wait_for_db()
    if not db_ready:
        logging.error("Database is not available, but continuing startup...")
        return

    # Create database tables
    try:
        Base.metadata.create_all(bind=engine)
        logging.info("Database tables created successfully")
    except Exception as e:
        logging.error(f"Failed to create database tables: {e}")


@app.get("/")
def root():
    """Root endpoint with API information"""
    return {
        "message": "Database Dump & Restore Tool API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


# Include routers
app.include_router(configs.router, prefix="/configs", tags=["configs"])
app.include_router(dump.router, prefix="/dump", tags=["dump"])
app.include_router(restore.router, prefix="/restore", tags=["restore"])
app.include_router(docker.router, prefix="/docker", tags=["docker"])
app.include_router(
    docker_compose.router, prefix="/docker-compose", tags=["docker-compose"]
)
