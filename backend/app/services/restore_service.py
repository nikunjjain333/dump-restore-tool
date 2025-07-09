import os
import logging
import subprocess
import re
import time
from typing import Dict, Any, Optional
from .docker_service import get_docker_client

logger = logging.getLogger(__name__)

def _get_consistent_path(config_name: str, db_type: str, dump_file_name: Optional[str] = None, operation: str = 'restore') -> str:
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

def run_restore(db_type: str, params: Dict[str, Any], config_name: str, restore_password: str, 
                run_path: Optional[str] = None, local_database_name: Optional[str] = None, dump_file_name: Optional[str] = None, restore_username: Optional[str] = None, restore_host: Optional[str] = None, restore_port: Optional[str] = None, restore_stack_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Run database restore operation with consistent file path
    """
    try:
        # Debug logging to show received values
        logger.info(f"Received restore parameters - restore_host: {restore_host}, restore_port: {restore_port}, restore_stack_name: {restore_stack_name}")
        logger.info(f"Original params: {params}")
        logger.info(f"Config values - restore_host: {restore_host}, restore_port: {restore_port}")
        
        # Generate path to look for the dump file using custom filename
        path = _get_consistent_path(config_name, db_type, dump_file_name, 'dump')
        
        logger.info(f"Starting restore operation for config '{config_name}' from path: {path}")
        
        # Enforce restore on Docker Compose network
        params = dict(params)  # Make a copy to avoid mutating input
        
        # Use local database name if provided, otherwise use the original database name
        if local_database_name:
            params['database'] = local_database_name
            logger.info(f"Using local database name for restore: {local_database_name}")
        
        # Use restore password (required)
        params['password'] = restore_password
        logger.info("Using restore password for restore operation")
        
        # Handle restore username with priority logic
        if restore_username:
            params['username'] = restore_username
            logger.info(f"Using restore username for restore operation: {restore_username}")
        else:
            # Fall back to dump config username
            if 'username' not in params:
                logger.warning("No username found in dump config, this may cause authentication issues")
            else:
                logger.info(f"Using dump config username for restore operation: {params['username']}")
        
        # Handle stack-based restore if stack name is provided
        if restore_stack_name:
            logger.info(f"Using stack-based restore for stack: {restore_stack_name}")
            
            # Get stack database information
            from .docker_compose_service import get_stack_database_info
            stack_info = get_stack_database_info(restore_stack_name)
            
            if not stack_info["success"]:
                return {
                    "success": False,
                    "message": f"Failed to get stack database info: {stack_info['message']}"
                }
            
            container_info = stack_info["container"]
            detected_db_type = container_info["db_type"]
            
            # Verify the detected database type matches the expected type
            if detected_db_type != db_type:
                return {
                    "success": False,
                    "message": f"Database type mismatch: Expected {db_type}, but found {detected_db_type} in stack '{restore_stack_name}'"
                }
            
            # Use the container name as host (Docker Compose networking)
            params['host'] = container_info['name'].replace('/', '')  # Remove leading slash
            logger.info(f"Using container host for restore: {params['host']}")
            
            # Extract port from container info if available
            if not restore_port:
                ports = container_info.get('ports', '')
                if ports:
                    # Extract port from Docker port mapping (e.g., "0.0.0.0:5432->5432/tcp")
                    import re
                    port_match = re.search(r'(\d+)->\d+/', ports)
                    if port_match:
                        params['port'] = port_match.group(1)
                        logger.info(f"Using detected port for restore: {params['port']}")
            
            # For PostgreSQL, use the detected version
            if detected_db_type == 'postgres' and stack_info.get('postgres_version'):
                postgres_version = stack_info['postgres_version']
                logger.info(f"Using PostgreSQL version {postgres_version} from stack")
                # Store the version for use in restore functions
                params['postgres_version'] = postgres_version
        
        else:
            # PRIORITY: Use restore field values if provided, otherwise fall back to dump config values
            
            # Handle restore host
            if restore_host:
                params['host'] = restore_host
                logger.info(f"Using restore host for restore operation: {restore_host}")
            else:
                # Fall back to dump config host, or default to localhost
                params['host'] = params.get('host', 'localhost')
                logger.info(f"Using dump config host for restore operation: {params['host']}")
            
            # Handle restore port
            if restore_port:
                params['port'] = restore_port
                logger.info(f"Using restore port for restore operation: {restore_port}")
            else:
                # Fall back to dump config port, or default based on db_type
                if 'port' not in params:
                    if db_type == 'postgres':
                        params['port'] = 5432
                    elif db_type == 'mysql':
                        params['port'] = 3306
                    elif db_type == 'redis':
                        params['port'] = 6379
                    else:
                        params['port'] = 5432  # Default fallback
                logger.info(f"Using dump config port for restore operation: {params['port']}")
        
        # For Docker-to-Docker communication, we need to use the correct host
        # If restore_host is 'localhost', we need to use the Docker host
        if restore_host == 'localhost' and not restore_stack_name:
            # Use host.docker.internal to access host from container
            params['host'] = 'host.docker.internal'
            logger.info("Using host.docker.internal for Docker-to-host communication")
        elif not restore_host and not restore_stack_name:
            params['host'] = 'localhost'  # Use Docker Compose service name
            logger.info("Using Docker Compose service name 'localhost' for restore operation")
        
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
                # fallback: just replace hostname
                import re
                params['uri'] = re.sub(r'//.*?:', '//localhost:', params['uri'])
        
        # Check if restore file exists in host /tmp directory
        host_tmp_path = '/tmp/' + os.path.basename(path)
        if not os.path.exists(host_tmp_path):
            return {
                "success": False,
                "message": f"Restore file not found: {host_tmp_path}. Please ensure the dump file exists before attempting restore. You may need to run a dump operation first."
            }
        
        # Use the host path for the restore operation
        path = host_tmp_path
        
        # Log the final connection parameters being used
        logger.info(f"Final restore connection parameters - Host: {params.get('host')}, Port: {params.get('port')}, Database: {params.get('database')}, Username: {params.get('username')}")
        
        if db_type == 'postgres':
            logger.info(f"About to run PostgreSQL restore with - Host: {params.get('host')}, Port: {params.get('port')}, Database: {params.get('database')}, Username: {params.get('username')}")
            return _restore_postgres(params, path, run_path)
        elif db_type == 'mysql':
            return _restore_mysql(params, path, run_path)
        elif db_type == 'mongodb':
            return _restore_mongodb(params, path, run_path)
        elif db_type == 'redis':
            return _restore_redis(params, path, run_path)
        elif db_type == 'sqlite':
            return _restore_sqlite(params, path, run_path)
        else:
            return {
                "success": False,
                "message": f"Unsupported database type: {db_type}"
            }
    except Exception as e:
        logger.error(f"Restore operation failed: {e}")
        return {
            "success": False,
            "message": f"Restore operation failed: {str(e)}"
        }

def _restore_postgres(params: Dict[str, Any], path: str, run_path: Optional[str] = None) -> Dict[str, Any]:
    """Restore PostgreSQL database with preparation steps"""
    try:
        client = get_docker_client()
        
        # Build the connection parameters
        host = params.get('host', 'localhost')
        port = str(params.get('port', 5432))
        database = params['database']
        username = params['username']
        password = params['password']
        
        # Get the filename from the path
        filename = os.path.basename(path)
        
        # Use detected PostgreSQL version if available, otherwise default to 16
        postgres_version = params.get('postgres_version', '16')
        postgres_image = f'postgres:{postgres_version}'
        
        logger.info(f"Using PostgreSQL image: {postgres_image}")
        logger.info(f"Starting PostgreSQL restore with preparation steps for database: {database}")
        
        # Step 1: Drop database if it exists (force drop)
        logger.info(f"Step 1: Dropping database '{database}' if it exists...")
        try:
            drop_container = client.containers.run(
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
        logger.info(f"Step 2: Creating fresh database '{database}'...")
        create_container = client.containers.run(
            postgres_image,
            command=f'createdb -h {host} -p {port} -U {username} {database}',
            environment={'PGPASSWORD': password},
            remove=True,
            detach=False
        )
        logger.info(f"Database '{database}' created successfully")
        
        # Step 3: Run Alembic migrations (if alembic is available)
        logger.info(f"Step 3: Running Alembic migrations...")
        try:
            # Check if alembic is available in the target environment
            alembic_container = client.containers.run(
                postgres_image,
                command=f'psql -h {host} -p {port} -U {username} -d {database} -c "SELECT version();"',
                environment={'PGPASSWORD': password},
                remove=True,
                detach=False
            )
            logger.info("Database connection verified, ready for restore")
        except Exception as e:
            logger.warning(f"Database connection test failed: {str(e)}")
        
        # Step 4: Perform the actual restore
        logger.info(f"Step 4: Performing restore from file: {filename}")
        restore_container = client.containers.run(
            postgres_image,
            command=f'psql -h {host} -p {port} -U {username} -d {database} -f /restore/{filename}',
            environment={'PGPASSWORD': password},
            volumes={
                '/tmp': {'bind': '/restore', 'mode': 'rw'}
            },
            working_dir=run_path if run_path else '/',
            remove=True,
            detach=False
        )
        
        logger.info(f"PostgreSQL restore completed successfully from: {path}")
        return {
            "success": True,
            "message": f"PostgreSQL restore completed successfully from: {path}",
            "path": path
        }
    except Exception as e:
        logger.error(f"PostgreSQL restore failed: {str(e)}")
        return {
            "success": False,
            "message": f"PostgreSQL restore failed: {str(e)}"
        }

def _restore_mysql(params: Dict[str, Any], path: str, run_path: Optional[str] = None) -> Dict[str, Any]:
    """Restore MySQL database"""
    try:
        client = get_docker_client()
        
        # Get the filename from the path
        filename = os.path.basename(path)
        
        # Create mysql restore command
        restore_cmd = f"mysql -h {params.get('host', 'localhost')} -P {params.get('port', 3306)} -u {params['username']} -p{params['password']} {params['database']} < /restore/{filename}"
        
        container = client.containers.run(
            'mysql:8.0',
            command=f'sh -c "{restore_cmd}"',
            volumes={
                '/tmp': {'bind': '/restore', 'mode': 'rw'}
            },
            working_dir=run_path if run_path else '/',
            remove=True,
            detach=False
        )
        
        return {
            "success": True,
            "message": f"MySQL restore completed successfully from: {path}",
            "path": path
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"MySQL restore failed: {str(e)}"
        }

def _restore_mongodb(params: Dict[str, Any], path: str, run_path: Optional[str] = None) -> Dict[str, Any]:
    """Restore MongoDB database"""
    try:
        client = get_docker_client()
        
        # Create mongorestore command
        restore_cmd = f"mongorestore --uri '{params['uri']}' --db {params['database']} /restore/{params['database']}"
        
        container = client.containers.run(
            'mongo:6.0',
            command=f'sh -c "{restore_cmd}"',
            volumes={
                '/tmp': {'bind': '/restore', 'mode': 'rw'}
            },
            working_dir=run_path if run_path else '/',
            remove=True,
            detach=False
        )
        
        return {
            "success": True,
            "message": f"MongoDB restore completed successfully from: {path}",
            "path": path
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"MongoDB restore failed: {str(e)}"
        }

def _restore_redis(params: Dict[str, Any], path: str, run_path: Optional[str] = None) -> Dict[str, Any]:
    """Restore Redis database"""
    try:
        client = get_docker_client()
        
        # Get the filename from the path
        filename = os.path.basename(path)
        
        # For Redis, we need to stop the server, replace the RDB file, and restart
        # This is a simplified approach - in production you might want more sophisticated handling
        
        # Copy the RDB file to Redis data directory
        redis_cmd = f"cp /restore/{filename} /data/dump.rdb"
        
        container = client.containers.run(
            'redis:7.0',
            command=f'sh -c "{redis_cmd}"',
            volumes={
                '/tmp': {'bind': '/restore', 'mode': 'rw'},
                '/var/lib/redis': {'bind': '/data', 'mode': 'rw'}
            },
            working_dir=run_path if run_path else '/',
            remove=True,
            detach=False
        )
        
        return {
            "success": True,
            "message": f"Redis restore completed successfully from: {path}",
            "path": path
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Redis restore failed: {str(e)}"
        }

def _restore_sqlite(params: Dict[str, Any], path: str, run_path: Optional[str] = None) -> Dict[str, Any]:
    """Restore SQLite database"""
    try:
        # For SQLite, we can copy the database file directly
        import shutil
        
        target_db = params['database']
        target_dir = os.path.dirname(target_db)
        
        # Ensure target directory exists
        os.makedirs(target_dir, exist_ok=True)
        
        # Copy the restore file to the target location
        shutil.copy2(path, target_db)
        
        return {
            "success": True,
            "message": f"SQLite restore completed successfully from: {path} to {target_db}",
            "path": target_db
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"SQLite restore failed: {str(e)}"
        } 