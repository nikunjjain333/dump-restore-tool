import os
import logging
from typing import Dict, Any, Optional
from .docker_service import get_docker_client
from app.core.utils import (
    get_consistent_path, validate_db_type, get_db_image,
    format_error_response, format_success_response
)

logger = logging.getLogger(__name__)

def run_dump(db_type: str, params: Dict[str, Any], config_name: str, 
             run_path: Optional[str] = None, dump_file_name: Optional[str] = None) -> Dict[str, Any]:
    """Run database dump operation with consistent file path"""
    try:
        if not validate_db_type(db_type):
            return format_error_response(f"Unsupported database type: {db_type}")
        
        path = get_consistent_path(config_name, db_type, dump_file_name)
        logger.info(f"Starting {db_type} dump operation for config '{config_name}' to path: {path}")
        
        dump_functions = {
            'postgres': _dump_postgres,
            'mysql': _dump_mysql,
            'mongodb': _dump_mongodb,
            'redis': _dump_redis,
            'sqlite': _dump_sqlite
        }
        
        return dump_functions[db_type](params, path, run_path)
    except Exception as e:
        logger.error(f"Dump operation failed: {e}")
        return format_error_response(f"Dump operation failed: {str(e)}")

def _dump_postgres(params: Dict[str, Any], path: str, run_path: Optional[str] = None) -> Dict[str, Any]:
    """Dump PostgreSQL database"""
    try:
        client = get_docker_client()
        filename = os.path.basename(path)
        
        host = params.get('host', 'localhost')
        port = str(params.get('port', 5432))
        database = params['database']
        username = params['username']
        password = params['password']
        
        logger.info(f"PostgreSQL dump: {host}:{port}, database: {database}, user: {username}")
        
        client.containers.run(
            get_db_image('postgres'),
            command=f'pg_dump -h {host} -p {port} -U {username} -d {database} -f /tmp/{filename}',
            environment={'PGPASSWORD': password},
            volumes={'/tmp': {'bind': '/tmp', 'mode': 'rw'}},
            working_dir=run_path or '/',
            remove=True,
            detach=False
        )
        
        if os.path.exists(path):
            logger.info(f"PostgreSQL dump completed: {path}")
            return format_success_response(f"PostgreSQL dump completed successfully: {path}", path=path)
        else:
            logger.error(f"PostgreSQL dump failed: File not created at {path}")
            return format_error_response("PostgreSQL dump failed: File not created. Check database connectivity and permissions.")
    except Exception as e:
        logger.error(f"PostgreSQL dump failed: {str(e)}")
        return format_error_response(f"PostgreSQL dump failed: {str(e)}")

def _dump_mysql(params: Dict[str, Any], path: str, run_path: Optional[str] = None) -> Dict[str, Any]:
    """Dump MySQL database"""
    try:
        client = get_docker_client()
        filename = os.path.basename(path)
        
        dump_cmd = (f"mysqldump -h {params.get('host', 'localhost')} "
                   f"-P {params.get('port', 3306)} -u {params['username']} "
                   f"-p{params['password']} {params['database']} > /tmp/{filename}")
        
        client.containers.run(
            get_db_image('mysql'),
            command=f'sh -c "{dump_cmd}"',
            volumes={'/tmp': {'bind': '/tmp', 'mode': 'rw'}},
            working_dir=run_path or '/',
            remove=True,
            detach=False
        )
        
        return format_success_response(f"MySQL dump completed successfully: {path}", path=path)
    except Exception as e:
        return format_error_response(f"MySQL dump failed: {str(e)}")

def _dump_mongodb(params: Dict[str, Any], path: str, run_path: Optional[str] = None) -> Dict[str, Any]:
    """Dump MongoDB database"""
    try:
        client = get_docker_client()
        filename = os.path.basename(path).replace('.bson', '')
        
        client.containers.run(
            get_db_image('mongodb'),
            command=f'mongodump --uri "{params["uri"]}" --db {params["database"]} --out /tmp/{filename}',
            volumes={'/tmp': {'bind': '/tmp', 'mode': 'rw'}},
            working_dir=run_path or '/',
            remove=True,
            detach=False
        )
        
        return format_success_response(f"MongoDB dump completed successfully: {path}", path=path)
    except Exception as e:
        return format_error_response(f"MongoDB dump failed: {str(e)}")

def _dump_redis(params: Dict[str, Any], path: str, run_path: Optional[str] = None) -> Dict[str, Any]:
    """Dump Redis database"""
    try:
        client = get_docker_client()
        filename = os.path.basename(path)
        
        redis_cmd = f"redis-cli -h {params.get('host', 'localhost')} -p {params.get('port', 6379)}"
        if params.get('password'):
            redis_cmd += f" -a {params['password']}"
        redis_cmd += f" --rdb /tmp/{filename}"
        
        client.containers.run(
            get_db_image('redis'),
            command=f'sh -c "{redis_cmd}"',
            volumes={'/tmp': {'bind': '/tmp', 'mode': 'rw'}},
            working_dir=run_path or '/',
            remove=True,
            detach=False
        )
        
        return format_success_response(f"Redis dump completed successfully: {path}", path=path)
    except Exception as e:
        return format_error_response(f"Redis dump failed: {str(e)}")

def _dump_sqlite(params: Dict[str, Any], path: str, run_path: Optional[str] = None) -> Dict[str, Any]:
    """Dump SQLite database"""
    try:
        import shutil
        source_db = params['database']
        
        if os.path.exists(source_db):
            shutil.copy2(source_db, path)
            return format_success_response(f"SQLite dump completed successfully: {path}", path=path)
        else:
            return format_error_response(f"SQLite database file not found: {source_db}")
    except Exception as e:
        return format_error_response(f"SQLite dump failed: {str(e)}") 