import os
import logging
import subprocess
import re
import time
from typing import Dict, Any, Optional
from .docker_service import get_docker_client

logger = logging.getLogger(__name__)

def _get_consistent_path(config_name: str, db_type: str, dump_file_name: Optional[str] = None, operation: str = 'dump') -> str:
    """Generate consistent file path for dump/restore operations"""
    
    # Use custom filename if provided, otherwise use config name
    if dump_file_name:
        # Clean the custom filename to make it filesystem-safe
        safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', dump_file_name)
        safe_name = re.sub(r'_+', '_', safe_name).strip('_')
        filename = safe_name
    else:
        # Clean config name to make it filesystem-safe
        safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', config_name)
        safe_name = re.sub(r'_+', '_', safe_name).strip('_')
        filename = safe_name
    
    # Add appropriate extension based on database type
    if db_type == 'postgres' or db_type == 'mysql':
        filename += '.sql'
    elif db_type == 'mongodb':
        filename += '.bson'
    elif db_type == 'redis':
        filename += '.rdb'
    elif db_type == 'sqlite':
        filename += '.db'
    else:
        filename += '.dump'
    
    # Use /tmp directory for consistency
    return os.path.join('/tmp', filename)

def run_dump(db_type: str, params: Dict[str, Any], config_name: str, run_path: Optional[str] = None, dump_file_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Run database dump operation with consistent file path
    """
    try:
        # Generate consistent file path using custom filename
        path = _get_consistent_path(config_name, db_type, dump_file_name, 'dump')
        
        logger.info(f"Starting dump operation for config '{config_name}' to path: {path}")
        
        if db_type == 'postgres':
            return _dump_postgres(params, path, run_path)
        elif db_type == 'mysql':
            return _dump_mysql(params, path, run_path)
        elif db_type == 'mongodb':
            return _dump_mongodb(params, path, run_path)
        elif db_type == 'redis':
            return _dump_redis(params, path, run_path)
        elif db_type == 'sqlite':
            return _dump_sqlite(params, path, run_path)
        else:
            return {
                "success": False,
                "message": f"Unsupported database type: {db_type}"
            }
    except Exception as e:
        logger.error(f"Dump operation failed: {e}")
        return {
            "success": False,
            "message": f"Dump operation failed: {str(e)}"
        }

def _dump_postgres(params: Dict[str, Any], path: str, run_path: Optional[str] = None) -> Dict[str, Any]:
    """Dump PostgreSQL database"""
    try:
        client = get_docker_client()
        host = params.get('host', 'localhost')
        port = str(params.get('port', 5432))
        database = params['database']
        username = params['username']
        password = params['password']
        
        filename = os.path.basename(path)
        
        # Run pg_dump in Docker container
        container = client.containers.run(
            'postgres:16',
            command=f'pg_dump -h {host} -p {port} -U {username} -d {database} -f /tmp/{filename}',
            environment={'PGPASSWORD': password},
            volumes={
                '/tmp': {'bind': '/tmp', 'mode': 'rw'}
            },
            working_dir=run_path if run_path else '/',
            remove=True,
            detach=False
        )
        
        return {
            "success": True,
            "message": f"PostgreSQL dump completed successfully: {path}",
            "path": path
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"PostgreSQL dump failed: {str(e)}"
        }

def _dump_mysql(params: Dict[str, Any], path: str, run_path: Optional[str] = None) -> Dict[str, Any]:
    """Dump MySQL database"""
    try:
        client = get_docker_client()
        filename = os.path.basename(path)
        
        dump_cmd = f"mysqldump -h {params.get('host', 'localhost')} -P {params.get('port', 3306)} -u {params['username']} -p{params['password']} {params['database']} > /tmp/{filename}"
        
        container = client.containers.run(
            'mysql:8.0',
            command=f'sh -c "{dump_cmd}"',
            volumes={
                '/tmp': {'bind': '/tmp', 'mode': 'rw'}
            },
            working_dir=run_path if run_path else '/',
            remove=True,
            detach=False
        )
        
        return {
            "success": True,
            "message": f"MySQL dump completed successfully: {path}",
            "path": path
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"MySQL dump failed: {str(e)}"
        }

def _dump_mongodb(params: Dict[str, Any], path: str, run_path: Optional[str] = None) -> Dict[str, Any]:
    """Dump MongoDB database"""
    try:
        client = get_docker_client()
        filename = os.path.basename(path).replace('.bson', '')
        
        container = client.containers.run(
            'mongo:6.0',
            command=f'mongodump --uri "{params["uri"]}" --db {params["database"]} --out /tmp/{filename}',
            volumes={
                '/tmp': {'bind': '/tmp', 'mode': 'rw'}
            },
            working_dir=run_path if run_path else '/',
            remove=True,
            detach=False
        )
        
        return {
            "success": True,
            "message": f"MongoDB dump completed successfully: {path}",
            "path": path
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"MongoDB dump failed: {str(e)}"
        }

def _dump_redis(params: Dict[str, Any], path: str, run_path: Optional[str] = None) -> Dict[str, Any]:
    """Dump Redis database"""
    try:
        client = get_docker_client()
        filename = os.path.basename(path)
        
        redis_cmd = f"redis-cli -h {params.get('host', 'localhost')} -p {params.get('port', 6379)}"
        if params.get('password'):
            redis_cmd += f" -a {params['password']}"
        redis_cmd += f" --rdb /tmp/{filename}"
        
        container = client.containers.run(
            'redis:7.0',
            command=f'sh -c "{redis_cmd}"',
            volumes={
                '/tmp': {'bind': '/tmp', 'mode': 'rw'}
            },
            working_dir=run_path if run_path else '/',
            remove=True,
            detach=False
        )
        
        return {
            "success": True,
            "message": f"Redis dump completed successfully: {path}",
            "path": path
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Redis dump failed: {str(e)}"
        }

def _dump_sqlite(params: Dict[str, Any], path: str, run_path: Optional[str] = None) -> Dict[str, Any]:
    """Dump SQLite database"""
    try:
        import shutil
        source_db = params['database']
        
        if os.path.exists(source_db):
            shutil.copy2(source_db, path)
            return {
                "success": True,
                "message": f"SQLite dump completed successfully: {path}",
                "path": path
            }
        else:
            return {
                "success": False,
                "message": f"SQLite database file not found: {source_db}"
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"SQLite dump failed: {str(e)}"
        } 