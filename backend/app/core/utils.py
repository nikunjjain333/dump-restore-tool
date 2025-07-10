import re
import os
from typing import Dict, Any, Optional
from pathlib import Path

# Database type configurations
DB_CONFIGS = {
    'postgres': {'extension': '.sql', 'image': 'postgres:16', 'default_port': 5432},
    'mysql': {'extension': '.sql', 'image': 'mysql:8.0', 'default_port': 3306},
    'mongodb': {'extension': '.bson', 'image': 'mongo:6.0', 'default_port': 27017},
    'redis': {'extension': '.rdb', 'image': 'redis:7.0', 'default_port': 6379},
    'sqlite': {'extension': '.db', 'image': 'alpine:latest', 'default_port': None}  # Use alpine for SQLite operations
}

def sanitize_filename(filename: str) -> str:
    """Sanitize filename to be filesystem-safe"""
    safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', filename)
    return re.sub(r'_+', '_', safe_name).strip('_')

def get_dump_directory() -> str:
    """Get the cross-platform dump directory path"""
    try:
        # Check if we're in a Docker container and use the mounted home directory
        if os.path.exists('/home') and os.path.isdir('/home'):
            # We're in a container with host home mounted
            home_dir = Path('/home')
        else:
            # We're on the host, use the actual home directory
            home_dir = Path.home()
        
        # Create Downloads/Database-dumps path
        dump_dir = home_dir / "Downloads" / "Database-dumps"
        
        # Create the directory if it doesn't exist
        dump_dir.mkdir(parents=True, exist_ok=True)
        
        # Verify the directory is writable
        test_file = dump_dir / ".test_write"
        try:
            test_file.touch()
            test_file.unlink()  # Remove test file
        except (PermissionError, OSError) as e:
            # If we can't write to Downloads, fall back to home directory
            dump_dir = home_dir / "Database-dumps"
            dump_dir.mkdir(parents=True, exist_ok=True)
        
        return str(dump_dir)
    except Exception as e:
        # Fallback to /tmp if everything else fails
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Could not create dump directory in Downloads, falling back to /tmp: {e}")
        return "/tmp"

def get_consistent_path(config_name: str, db_type: str, dump_file_name: Optional[str] = None) -> str:
    """Generate consistent file path for dump/restore operations"""
    filename = sanitize_filename(dump_file_name or config_name)
    extension = DB_CONFIGS.get(db_type, {}).get('extension', '.dump')
    
    # Use the cross-platform dump directory
    dump_dir = get_dump_directory()
    
    return os.path.join(dump_dir, f"{filename}{extension}")

def validate_db_type(db_type: str) -> bool:
    """Validate if database type is supported"""
    return db_type in DB_CONFIGS

def get_db_image(db_type: str) -> str:
    """Get Docker image for database type"""
    return DB_CONFIGS.get(db_type, {}).get('image', 'alpine:latest')

def get_db_default_port(db_type: str) -> Optional[int]:
    """Get default port for database type"""
    return DB_CONFIGS.get(db_type, {}).get('default_port')

def format_error_response(message: str, details: Optional[str] = None) -> Dict[str, Any]:
    """Format standardized error response"""
    response = {"success": False, "message": message}
    if details:
        response["details"] = details
    return response

def format_success_response(message: str, **kwargs) -> Dict[str, Any]:
    """Format standardized success response"""
    response = {"success": True, "message": message}
    response.update(kwargs)
    return response 