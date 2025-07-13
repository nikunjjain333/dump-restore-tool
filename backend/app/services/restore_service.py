import os
import logging
import subprocess
import shlex
from typing import Dict, Any, Optional
from app.core.utils import (
    get_consistent_path,
    validate_db_type,
    get_db_default_port,
    format_error_response,
    format_success_response,
    get_restore_directory,
    get_restore_path,
)
from app.services.docker_compose_service import get_stack_database_info

logger = logging.getLogger(__name__)


def ensure_restore_directory_exists():
    """Ensure the restore directory exists and is accessible"""
    try:
        restore_dir = get_restore_directory()
        os.makedirs(restore_dir, exist_ok=True)
        logger.info(f"Restore directory is ready: {restore_dir}")
        return True
    except Exception as e:
        logger.error(f"Failed to ensure restore directory exists: {e}")
        return False


def _run_host_command(
    cmd: str, env: Optional[Dict[str, str]] = None, cwd: Optional[str] = None
) -> subprocess.CompletedProcess:
    """Run a command on the host system"""
    try:
        # Parse command safely
        args = shlex.split(cmd)

        # Set up environment
        process_env = os.environ.copy()
        if env:
            process_env.update(env)

        logger.info(f"Running host command: {cmd}")
        result = subprocess.run(
            args,
            env=process_env,
            cwd=cwd,
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            logger.error(f"Command failed with return code {result.returncode}")
            logger.error(f"stdout: {result.stdout}")
            logger.error(f"stderr: {result.stderr}")

        return result
    except Exception as e:
        logger.error(f"Failed to run command: {e}")
        raise


def _prepare_restore_params(
    params: Dict[str, Any],
    db_type: str,
    restore_password: Optional[str],
    local_database_name: Optional[str] = None,
    restore_username: Optional[str] = None,
    restore_host: Optional[str] = None,
    restore_port: Optional[str] = None,
) -> Dict[str, Any]:
    """Prepare parameters for restore operation"""
    params = dict(params)  # Make a copy to avoid mutating input

    # Use local database name if provided
    if local_database_name:
        params["database"] = local_database_name
        logger.info(f"Using local database name for restore: {local_database_name}")

    # Use restore password if provided
    if restore_password:
        params["password"] = restore_password
        logger.info("Using restore password for authentication")
    else:
        logger.info(
            "No restore password provided, using original connection parameters"
        )

    # Handle restore username with priority logic
    if restore_username:
        params["username"] = restore_username
        logger.info(f"Using restore username: {restore_username}")

    # Handle restore host and port with priority logic
    if restore_host:
        params["host"] = restore_host
        logger.info(f"Using restore host: {restore_host}")
    else:
        params["host"] = params.get("host", "localhost")

    if restore_port:
        params["port"] = restore_port
        logger.info(f"Using restore port: {restore_port}")
    else:
        params["port"] = params.get("port", get_db_default_port(db_type) or 5432)

    # For Docker-to-Docker communication, use host.docker.internal for localhost
    if params["host"] == "localhost":
        params["host"] = "host.docker.internal"
        logger.info("Using host.docker.internal for Docker-to-host communication")

    # Handle MongoDB URI if present
    if db_type == "mongodb" and "uri" in params:
        try:
            from urllib.parse import urlparse, urlunparse

            uri = params["uri"]
            parsed = urlparse(uri)
            new_netloc = "localhost"
            if parsed.port:
                new_netloc += f":{parsed.port}"
            if parsed.username:
                if parsed.password:
                    new_netloc = f"{parsed.username}:{parsed.password}@" + new_netloc
                else:
                    new_netloc = f"{parsed.username}@" + new_netloc
            parsed = parsed._replace(netloc=new_netloc)
            params["uri"] = urlunparse(parsed)
        except Exception:
            import re

            params["uri"] = re.sub(r"//.*?:", "//localhost:", params["uri"])

    return params


def run_restore(
    db_type: str,
    params: Dict[str, Any],
    config_name: str,
    restore_password: Optional[str],
    local_database_name: Optional[str] = None,
    dump_file_name: Optional[str] = None,
    restore_username: Optional[str] = None,
    restore_host: Optional[str] = None,
    restore_port: Optional[str] = None,
    stack_name: Optional[str] = None,
) -> Dict[str, Any]:
    """Run database restore operation with consistent file path"""
    try:
        if not validate_db_type(db_type):
            return format_error_response(f"Unsupported database type: {db_type}")
        if not ensure_restore_directory_exists():
            return format_error_response("Failed to create or access restore directory")
        params = _prepare_restore_params(
            params,
            db_type,
            restore_password,
            local_database_name,
            restore_username,
            restore_host,
            restore_port,
        )
        path = get_consistent_path(config_name, db_type, dump_file_name)
        logger.info(
            f"Starting {db_type} restore operation for config '{config_name}' from path: {path}"
        )
        if not os.path.exists(path):
            return format_error_response(
                f"Restore file not found: {path}. Please ensure the dump file exists before attempting restore."
            )
        logger.info(
            f"Restore connection - Host: {params.get('host')}, Port: {params.get('port')}, "
            f"Database: {params.get('database')}, Username: {params.get('username')}"
        )
        restore_functions = {
            "postgres": lambda p, pa: _restore_postgres(p, pa, stack_name),
            "mysql": _restore_mysql,
            "mongodb": _restore_mongodb,
            "redis": _restore_redis,
            "sqlite": _restore_sqlite,
        }
        return restore_functions[db_type](params, path)
    except Exception as e:
        logger.error(f"Restore operation failed: {e}")
        return format_error_response(f"Restore operation failed: {str(e)}")


# Update _restore_postgres to accept stack_name and run inside container if provided


def _restore_postgres(
    params: Dict[str, Any], path: str, stack_name: Optional[str] = None
) -> Dict[str, Any]:
    """Restore PostgreSQL database using host psql or inside container if stack_name is provided"""
    try:
        host = params.get("host", "localhost")
        port = str(params.get("port", 5432))
        database = params.get("database")
        username = params.get("username")
        password = params.get("password")
        if not database:
            error_msg = "Database name is required for PostgreSQL restore."
            logger.error(error_msg)
            return format_error_response(error_msg)
        if not username or not password:
            error_msg = "Username and password are required for PostgreSQL restore."
            logger.error(error_msg)
            return format_error_response(error_msg)
        if ":" in host:
            host_parts = host.split(":")
            if len(host_parts) == 2 and host_parts[1].isdigit():
                host = host_parts[0]
                port = host_parts[1]
                logger.info(
                    f"Extracted host '{host}' and port '{port}' from combined host parameter"
                )
        logger.info(
            f"PostgreSQL restore: {host}:{port}, database: {database}, user: {username}"
        )
        env = {"PGPASSWORD": password}

        def docker_exec(cmd):
            info = get_stack_database_info(stack_name)
            if not info.get("success"):
                return format_error_response(
                    f"Could not find database container for stack '{stack_name}': {info.get('message')}"
                )
            container_id = info["container"]["id"]
            docker_cmd = (
                f'docker exec -e PGPASSWORD={password} {container_id} bash -c "{cmd}"'
            )
            logger.info(f"Running in container: {docker_cmd}")
            result = subprocess.run(
                docker_cmd, shell=True, capture_output=True, text=True
            )
            if result.returncode != 0:
                logger.error(f"Command failed: {result.stderr}")
            return result

        # Step 1: Drop database if it exists
        try:
            drop_cmd = f"dropdb -h {host} -p {port} -U {username} {database} --force"
            result = (
                docker_exec(drop_cmd)
                if stack_name
                else _run_host_command(drop_cmd, env=env)
            )
            if hasattr(result, "returncode") and result.returncode == 0:
                logger.info(f"Database '{database}' dropped successfully")
            else:
                logger.info(
                    f"Database '{database}' did not exist or drop failed (continuing)"
                )
        except Exception as e:
            logger.info(
                f"Database '{database}' did not exist or drop failed (continuing): {str(e)}"
            )
        # Step 2: Create fresh database
        create_cmd = f"createdb -h {host} -p {port} -U {username} {database}"
        result = (
            docker_exec(create_cmd)
            if stack_name
            else _run_host_command(create_cmd, env=env)
        )
        if hasattr(result, "returncode") and result.returncode != 0:
            error_msg = f"Failed to create database '{database}': {getattr(result, 'stderr', '')}"
            logger.error(error_msg)
            return format_error_response(error_msg)
        logger.info(f"Database '{database}' created successfully")
        # Step 3: Perform the actual restore
        restore_cmd = f"psql -h {host} -p {port} -U {username} -d {database} -f {path}"
        result = (
            docker_exec(restore_cmd)
            if stack_name
            else _run_host_command(restore_cmd, env=env)
        )
        if hasattr(result, "returncode") and result.returncode == 0:
            logger.info(f"PostgreSQL restore completed: {path}")
            return format_success_response(
                f"PostgreSQL restore completed successfully from: {path}", path=path
            )
        else:
            error_msg = f"PostgreSQL restore failed: {getattr(result, 'stderr', '')}"
            logger.error(error_msg)
            return format_error_response(error_msg)
    except Exception as e:
        logger.error(f"PostgreSQL restore failed: {str(e)}")
        return format_error_response(f"PostgreSQL restore failed: {str(e)}")


def _restore_mysql(params: Dict[str, Any], path: str) -> Dict[str, Any]:
    """Restore MySQL database using host mysql"""
    try:
        host = params.get("host", "localhost")
        port = str(params.get("port", 3306))
        database = params.get("database")
        username = params.get("username")
        password = params.get("password")

        if not database:
            error_msg = "Database name is required for MySQL restore."
            logger.error(error_msg)
            return format_error_response(error_msg)
        if not username or not password:
            error_msg = "Username and password are required for MySQL restore."
            logger.error(error_msg)
            return format_error_response(error_msg)

        # Clean up host parameter - remove port if it's included in the host
        if ":" in host:
            host_parts = host.split(":")
            if len(host_parts) == 2 and host_parts[1].isdigit():
                host = host_parts[0]
                port = host_parts[1]
                logger.info(
                    f"Extracted host '{host}' and port '{port}' from combined host parameter"
                )

        logger.info(
            f"MySQL restore: {host}:{port}, database: {database}, user: {username}"
        )

        # Build mysql command to restore from file
        restore_cmd = (
            f"mysql -h {host} -P {port} -u {username} -p{password} {database} < {path}"
        )

        # Run the command
        result = _run_host_command(restore_cmd)

        if result.returncode == 0:
            logger.info(f"MySQL restore completed: {path}")
            return format_success_response(
                f"MySQL restore completed successfully from: {path}", path=path
            )
        else:
            error_msg = f"MySQL restore failed: {result.stderr}"
            logger.error(error_msg)
            return format_error_response(error_msg)

    except Exception as e:
        logger.error(f"MySQL restore failed: {str(e)}")
        return format_error_response(f"MySQL restore failed: {str(e)}")


def _restore_mongodb(params: Dict[str, Any], path: str) -> Dict[str, Any]:
    """Restore MongoDB database using host mongorestore"""
    try:
        uri = params.get("uri")
        database = params.get("database")

        if not uri:
            return format_error_response("MongoDB URI is required")
        # database is optional for MongoDB

        logger.info(f"MongoDB restore: database: {database}")

        # For now, return an error since mongorestore is not installed
        # TODO: Install MongoDB tools in the container or use a different approach
        return format_error_response(
            "MongoDB restore is not currently supported. Please install mongorestore tools in the container or use a different approach."
        )

        # Build mongorestore command
        restore_cmd = f"mongorestore --uri '{uri}' --db {database} {path}"

        # Run the command
        result = _run_host_command(restore_cmd)

        if result.returncode == 0:
            logger.info(f"MongoDB restore completed: {path}")
            return format_success_response(
                f"MongoDB restore completed successfully from: {path}", path=path
            )
        else:
            error_msg = f"MongoDB restore failed: {result.stderr}"
            logger.error(error_msg)
            return format_error_response(error_msg)

    except Exception as e:
        logger.error(f"MongoDB restore failed: {str(e)}")
        return format_error_response(f"MongoDB restore failed: {str(e)}")


def _restore_redis(params: Dict[str, Any], path: str) -> Dict[str, Any]:
    """Restore Redis database using host redis-cli"""
    try:
        host = params.get("host", "localhost")
        port = str(params.get("port", 6379))
        password = params.get("password")

        # Clean up host parameter - remove port if it's included in the host
        if ":" in host:
            host_parts = host.split(":")
            if len(host_parts) == 2 and host_parts[1].isdigit():
                host = host_parts[0]
                port = host_parts[1]
                logger.info(
                    f"Extracted host '{host}' and port '{port}' from combined host parameter"
                )

        logger.info(f"Redis restore: {host}:{port}")

        # Build redis-cli command to restore from file
        restore_cmd = f"redis-cli -h {host} -p {port}"
        if password:
            restore_cmd += f" -a {password}"
        restore_cmd += f" --pipe < {path}"

        # Run the command
        result = _run_host_command(restore_cmd)

        if result.returncode == 0:
            logger.info(f"Redis restore completed: {path}")
            return format_success_response(
                f"Redis restore completed successfully from: {path}", path=path
            )
        else:
            error_msg = f"Redis restore failed: {result.stderr}"
            logger.error(error_msg)
            return format_error_response(error_msg)

    except Exception as e:
        logger.error(f"Redis restore failed: {str(e)}")
        return format_error_response(f"Redis restore failed: {str(e)}")


def _restore_sqlite(params: Dict[str, Any], path: str) -> Dict[str, Any]:
    """Restore SQLite database"""
    try:
        import shutil

        target_db = params["database"]
        target_dir = os.path.dirname(target_db)

        # Ensure target directory exists
        os.makedirs(target_dir, exist_ok=True)

        # Copy the restore file to the target location
        shutil.copy2(path, target_db)

        return format_success_response(
            f"SQLite restore completed successfully from: {path} to {target_db}",
            path=target_db,
        )
    except Exception as e:
        return format_error_response(f"SQLite restore failed: {str(e)}")
