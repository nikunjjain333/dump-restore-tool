from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import config, operations

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Database Dump & Restore Tool")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(config.router)
app.include_router(operations.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Database Dump & Restore Tool"}
