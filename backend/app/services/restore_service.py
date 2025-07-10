import os
import logging
from typing import Dict, Any, Optional
from .docker_service import get_docker_client
from app.core.utils import (
    get_consistent_path, validate_db_type, get_db_image, get_db_default_port,
    format_error_response, format_success_response, get_dump_directory
)

logger = logging.getLogger(__name__)

def ensure_dump_directory_exists():
    """Ensure the dump directory exists and is accessible"""
    try:
        dump_dir = get_dump_directory()
        os.makedirs(dump_dir, exist_ok=True)
        logger.info(f"Dump directory is ready: {dump_dir}")
        return True
    except Exception as e:
        logger.error(f"Failed to ensure dump directory exists: {e}")
        return False

def _prepare_restore_params(params: Dict[str, Any], db_type: str, restore_password: str,
                           local_database_name: Optional[str] = None, restore_username: Optional[str] = None,
                           restore_host: Optional[str] = None, restore_port: Optional[str] = None) -> Dict[str, Any]:
    """Prepare parameters for restore operation"""
    params = dict(params)  # Make a copy to avoid mutating input
    
    # Use local database name if provided
    if local_database_name:
        params['database'] = local_database_name
        logger.info(f"Using local database name for restore: {local_database_name}")
    
    # Use restore password (required)
    params['password'] = restore_password
    
    # Handle restore username with priority logic
    if restore_username:
        params['username'] = restore_username
        logger.info(f"Using restore username: {restore_username}")
    
    # Handle restore host and port with priority logic
    if restore_host:
        params['host'] = restore_host
        logger.info(f"Using restore host: {restore_host}")
    else:
        params['host'] = params.get('host', 'localhost')
    
    if restore_port:
        params['port'] = restore_port
        logger.info(f"Using restore port: {restore_port}")
    else:
        params['port'] = params.get('port', get_db_default_port(db_type) or 5432)
    
    # For Docker-to-Docker communication, use host.docker.internal for localhost
    if params['host'] == 'localhost':
        params['host'] = 'host.docker.internal'
        logger.info("Using host.docker.internal for Docker-to-host communication")
    
    # Handle MongoDB URI if present
    if db_type == 'mongodb' and 'uri' in params:
        try:
            from urllib.parse import urlparse, urlunparse
            uri = params['uri']
            parsed = urlparse(uri)
            new_netloc = 'localhost'
            if parsed.port:
                new_netloc += f':{parsed.port}'
            if parsed.username:
                if parsed.password:
                    new_netloc = f"{parsed.username}:{parsed.password}@" + new_netloc
                else:
                    new_netloc = f"{parsed.username}@" + new_netloc
            parsed = parsed._replace(netloc=new_netloc)
            params['uri'] = urlunparse(parsed)
        except Exception:
            import re
            params['uri'] = re.sub(r'//.*?:', '//localhost:', params['uri'])
    
    return params

def run_restore(db_type: str, params: Dict[str, Any], config_name: str, restore_password: str,
                run_path: Optional[str] = None, local_database_name: Optional[str] = None,
                dump_file_name: Optional[str] = None, restore_username: Optional[str] = None,
                restore_host: Optional[str] = None, restore_port: Optional[str] = None) -> Dict[str, Any]:
    """Run database restore operation with consistent file path"""
    try:
        if not validate_db_type(db_type):
            return format_error_response(f"Unsupported database type: {db_type}")
        
        # Ensure dump directory exists
        if not ensure_dump_directory_exists():
            return format_error_response("Failed to create or access dump directory")
        
        # Prepare parameters for restore
        params = _prepare_restore_params(params, db_type, restore_password, local_database_name,
                                       restore_username, restore_host, restore_port)
        
        # Generate path to look for the dump file
        path = get_consistent_path(config_name, db_type, dump_file_name)
        
        logger.info(f"Starting {db_type} restore operation for config '{config_name}' from path: {path}")
        
        # Check if restore file exists
        if not os.path.exists(path):
            return format_error_response(
                f"Restore file not found: {path}. Please ensure the dump file exists before attempting restore."
            )
        
        # Log final connection parameters
        logger.info(f"Restore connection - Host: {params.get('host')}, Port: {params.get('port')}, "
                   f"Database: {params.get('database')}, Username: {params.get('username')}")
        
        restore_functions = {
            'postgres': _restore_postgres,
            'mysql': _restore_mysql,
            'mongodb': _restore_mongodb,
            'redis': _restore_redis,
            'sqlite': _restore_sqlite
        }
        
        return restore_functions[db_type](params, path, run_path)
    except Exception as e:
        logger.error(f"Restore operation failed: {e}")
        return format_error_response(f"Restore operation failed: {str(e)}")

def _restore_postgres(params: Dict[str, Any], path: str, run_path: Optional[str] = None) -> Dict[str, Any]:
    """Restore PostgreSQL database with preparation steps"""
    try:
        client = get_docker_client()
        filename = os.path.basename(path)
        
        host = params.get('host', 'localhost')
        port = str(params.get('port', 5432))
        database = params['database']
        username = params['username']
        password = params['password']
        
        postgres_version = params.get('postgres_version', '16')
        postgres_image = f'postgres:{postgres_version}'
        
        logger.info(f"PostgreSQL restore: {host}:{port}, database: {database}, user: {username}")
        
        # Step 1: Drop database if it exists
        try:
            client.containers.run(
                postgres_image,
                command=f'dropdb -h {host} -p {port} -U {username} {database} --force',
                environment={'PGPASSWORD': password},
                remove=True,
                detach=False
            )
            logger.info(f"Database '{database}' dropped successfully")
        except Exception as e:
            logger.info(f"Database '{database}' did not exist or drop failed (continuing): {str(e)}")
        
        # Step 2: Create fresh database
        client.containers.run(
            postgres_image,
            command=f'createdb -h {host} -p {port} -U {username} {database}',
            environment={'PGPASSWORD': password},
            remove=True,
            detach=False
        )
        logger.info(f"Database '{database}' created successfully")
        
        # Step 3: Perform the actual restore
        dump_dir = get_dump_directory()
        client.containers.run(
            postgres_image,
            command=f'psql -h {host} -p {port} -U {username} -d {database} -f /restore/{filename}',
            environment={'PGPASSWORD': password},
            volumes={dump_dir: {'bind': '/restore', 'mode': 'rw'}},
            working_dir=run_path or '/',
            remove=True,
            detach=False
        )
        
        logger.info(f"PostgreSQL restore completed: {path}")
        return format_success_response(f"PostgreSQL restore completed successfully from: {path}", path=path)
    except Exception as e:
        logger.error(f"PostgreSQL restore failed: {str(e)}")
        return format_error_response(f"PostgreSQL restore failed: {str(e)}")

def _restore_mysql(params: Dict[str, Any], path: str, run_path: Optional[str] = None) -> Dict[str, Any]:
    """Restore MySQL database"""
    try:
        client = get_docker_client()
        filename = os.path.basename(path)
        
        restore_cmd = (f"mysql -h {params.get('host', 'localhost')} "
                      f"-P {params.get('port', 3306)} -u {params['username']} "
                      f"-p{params['password']} {params['database']} < /restore/{filename}")
        
        dump_dir = get_dump_directory()
        client.containers.run(
            get_db_image('mysql'),
            command=f'sh -c "{restore_cmd}"',
            volumes={dump_dir: {'bind': '/restore', 'mode': 'rw'}},
            working_dir=run_path or '/',
            remove=True,
            detach=False
        )
        
        return format_success_response(f"MySQL restore completed successfully from: {path}", path=path)
    except Exception as e:
        return format_error_response(f"MySQL restore failed: {str(e)}")

def _restore_mongodb(params: Dict[str, Any], path: str, run_path: Optional[str] = None) -> Dict[str, Any]:
    """Restore MongoDB database"""
    try:
        client = get_docker_client()
        
        restore_cmd = f"mongorestore --uri '{params['uri']}' --db {params['database']} /restore/{params['database']}"
        
        dump_dir = get_dump_directory()
        client.containers.run(
            get_db_image('mongodb'),
            command=f'sh -c "{restore_cmd}"',
            volumes={dump_dir: {'bind': '/restore', 'mode': 'rw'}},
            working_dir=run_path or '/',
            remove=True,
            detach=False
        )
        
        return format_success_response(f"MongoDB restore completed successfully from: {path}", path=path)
    except Exception as e:
        return format_error_response(f"MongoDB restore failed: {str(e)}")

def _restore_redis(params: Dict[str, Any], path: str, run_path: Optional[str] = None) -> Dict[str, Any]:
    """Restore Redis database"""
    try:
        client = get_docker_client()
        filename = os.path.basename(path)
        
        # Copy the RDB file to Redis data directory
        redis_cmd = f"cp /restore/{filename} /data/dump.rdb"
        
        dump_dir = get_dump_directory()
        client.containers.run(
            get_db_image('redis'),
            command=f'sh -c "{redis_cmd}"',
            volumes={
                dump_dir: {'bind': '/restore', 'mode': 'rw'},
                '/var/lib/redis': {'bind': '/data', 'mode': 'rw'}
            },
            working_dir=run_path or '/',
            remove=True,
            detach=False
        )
        
        return format_success_response(f"Redis restore completed successfully from: {path}", path=path)
    except Exception as e:
        return format_error_response(f"Redis restore failed: {str(e)}")

def _restore_sqlite(params: Dict[str, Any], path: str, run_path: Optional[str] = None) -> Dict[str, Any]:
    """Restore SQLite database"""
    try:
        import shutil
        
        target_db = params['database']
        target_dir = os.path.dirname(target_db)
        
        # Ensure target directory exists
        os.makedirs(target_dir, exist_ok=True)
        
        # Copy the restore file to the target location
        shutil.copy2(path, target_db)
        
        return format_success_response(f"SQLite restore completed successfully from: {path} to {target_db}", path=target_db)
    except Exception as e:
        return format_error_response(f"SQLite restore failed: {str(e)}") 