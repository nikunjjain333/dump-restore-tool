import os
import logging
import subprocess
from typing import Dict, Any, Optional
from .docker_service import get_docker_client

logger = logging.getLogger(__name__)

def run_dump(db_type: str, params: Dict[str, Any], path: str, run_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Run database dump operation
    """
    try:
        # Ensure the dump directory exists
        os.makedirs(os.path.dirname(path), exist_ok=True)
        
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
        
        # Build the pg_dump command with direct parameter substitution
        host = params.get('host', 'localhost')
        port = str(params.get('port', 5432))
        database = params['database']
        username = params['username']
        password = params['password']
        
        # Get the filename from the path to preserve the original extension
        filename = os.path.basename(path)
        
        # Run pg_dump in Docker container with direct parameter substitution
        container = client.containers.run(
            'postgres:16',
            command=f'pg_dump -h {host} -p {port} -U {username} -d {database} -f /dump/{filename}',
            environment={'PGPASSWORD': password},  # Only set password as env var
            volumes={
                os.path.dirname(path): {'bind': '/dump', 'mode': 'rw'}
            },
            working_dir=run_path if run_path else '/',
            remove=True,
            detach=False
        )
        
        # No need to rename since we're using the correct filename directly
        
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
        
        # Get the filename from the path to preserve the original extension
        filename = os.path.basename(path)
        
        # Create mysqldump command
        dump_cmd = f"mysqldump -h {params.get('host', 'localhost')} -P {params.get('port', 3306)} -u {params['username']} -p{params['password']} {params['database']} > /dump/{filename}"
        
        container = client.containers.run(
            'mysql:8.0',
            command=f'sh -c "{dump_cmd}"',
            volumes={
                os.path.dirname(path): {'bind': '/dump', 'mode': 'rw'}
            },
            working_dir=run_path if run_path else '/',
            remove=True,
            detach=False
        )
        
        # No need to rename since we're using the correct filename directly
        
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
        
        # Create mongodump command
        dump_cmd = f"mongodump --uri '{params['uri']}' --db {params['database']} --out /dump"
        
        container = client.containers.run(
            'mongo:6.0',
            command=f'sh -c "{dump_cmd}"',
            volumes={
                os.path.dirname(path): {'bind': '/dump', 'mode': 'rw'}
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
        
        # Get the filename from the path
        filename = os.path.basename(path)
        
        # Create redis-cli command for RDB dump
        redis_cmd = f"redis-cli -h {params.get('host', 'localhost')} -p {params.get('port', 6379)}"
        if params.get('password'):
            redis_cmd += f" -a {params['password']}"
        redis_cmd += f" --rdb /dump/{filename}"
        
        container = client.containers.run(
            'redis:7.0',
            command=f'sh -c "{redis_cmd}"',
            volumes={
                os.path.dirname(path): {'bind': '/dump', 'mode': 'rw'}
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
        # For SQLite, we can copy the database file directly
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