import os
import logging
import subprocess
import shlex
from typing import Dict, Any, Optional
from app.core.utils import (
    get_consistent_path, validate_db_type,
    format_error_response, format_success_response, get_dump_directory
)

logger = logging.getLogger(__name__)

def ensure_dump_directory_exists():
    """Ensure the dump directory exists and is writable"""
    try:
        dump_dir = get_dump_directory()
        os.makedirs(dump_dir, exist_ok=True)
        
        # Test write access
        test_file = os.path.join(dump_dir, ".test_write")
        with open(test_file, 'w') as f:
            f.write("test")
        os.remove(test_file)
        
        logger.info(f"Dump directory is ready: {dump_dir}")
        return True
    except Exception as e:
        logger.error(f"Failed to ensure dump directory exists: {e}")
        return False

def run_dump(db_type: str, params: Dict[str, Any], config_name: str, 
            dump_file_name: Optional[str] = None) -> Dict[str, Any]:
    """Run database dump operation with consistent file path"""
    try:
        if not validate_db_type(db_type):
            return format_error_response(f"Unsupported database type: {db_type}")
        
        # Ensure dump directory exists
        if not ensure_dump_directory_exists():
            return format_error_response("Failed to create or access dump directory")
        
        path = get_consistent_path(config_name, db_type, dump_file_name)
        dump_dir = get_dump_directory()
        logger.info(f"Dump directory: {dump_dir}")
        logger.info(f"Starting {db_type} dump operation for config '{config_name}' to path: {path}")
        
        dump_functions = {
            'postgres': _dump_postgres,
            'mysql': _dump_mysql,
            'mongodb': _dump_mongodb,
            'redis': _dump_redis,
            'sqlite': _dump_sqlite
        }
        
        return dump_functions[db_type](params, path)
    except Exception as e:
        logger.error(f"Dump operation failed: {e}")
        return format_error_response(f"Dump operation failed: {str(e)}")

def _run_host_command(cmd: str, env: Optional[Dict[str, str]] = None) -> subprocess.CompletedProcess:
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

def _dump_postgres(params: Dict[str, Any], path: str) -> Dict[str, Any]:
    """Dump PostgreSQL database using host pg_dump"""
    try:
        host = params.get('host', 'localhost')
        port = str(params.get('port', 5432))
        database = params.get('database')
        username = params.get('username')
        password = params.get('password')

        if not database:
            error_msg = "Database name is required for PostgreSQL dump."
            logger.error(error_msg)
            return format_error_response(error_msg)
        if not username or not password:
            error_msg = "Username and password are required for PostgreSQL dump."
            logger.error(error_msg)
            return format_error_response(error_msg)
        
        logger.info(f"PostgreSQL dump: {host}:{port}, database: {database}, user: {username}")
        
        # Build pg_dump command
        cmd = f"pg_dump -h {host} -p {port} -U {username} -d {database}"
        
        # Add format options for better compatibility
        if path.endswith('.sql'):
            cmd += " --clean --if-exists"
        else:
            cmd += " -Fc"  # Custom format for .dump files
        
        # Add exclude table if specified
        if params.get('exclude_table'):
            cmd += f" --exclude-table {params['exclude_table']}"
        
        # Set environment for password
        env = {'PGPASSWORD': password}
        
        # Run the command and redirect output to file
        result = _run_host_command(cmd, env=env)
        
        if result.returncode == 0:
            # Write output to file
            with open(path, 'w') as f:
                f.write(result.stdout)
            
            logger.info(f"PostgreSQL dump completed: {path}")
            return format_success_response(f"PostgreSQL dump completed successfully: {path}", path=path)
        else:
            error_msg = f"PostgreSQL dump failed: {result.stderr}"
            logger.error(error_msg)
            return format_error_response(error_msg)
            
    except Exception as e:
        logger.error(f"PostgreSQL dump failed: {str(e)}")
        return format_error_response(f"PostgreSQL dump failed: {str(e)}")

def _dump_mysql(params: Dict[str, Any], path: str) -> Dict[str, Any]:
    """Dump MySQL database using host mysqldump"""
    try:
        host = params.get('host', 'localhost')
        port = str(params.get('port', 3306))
        database = params.get('database')
        username = params.get('username')
        password = params.get('password')

        if not database:
            error_msg = "Database name is required for MySQL dump."
            logger.error(error_msg)
            return format_error_response(error_msg)
        if not username or not password:
            error_msg = "Username and password are required for MySQL dump."
            logger.error(error_msg)
            return format_error_response(error_msg)
        
        logger.info(f"MySQL dump: {host}:{port}, database: {database}, user: {username}")
        
        # Build mysqldump command
        cmd = f"mysqldump -h {host} -P {port} -u {username} -p{password} {database}"
        
        # Add options for better compatibility
        cmd += " --single-transaction --routines --triggers"
        
        # Set environment (password is passed via command line for MySQL)
        env = {}
        
        # Run the command and redirect output to file
        result = _run_host_command(cmd, env=env)
        
        if result.returncode == 0:
            # Write output to file
            with open(path, 'w') as f:
                f.write(result.stdout)
            
            logger.info(f"MySQL dump completed: {path}")
            return format_success_response(f"MySQL dump completed successfully: {path}", path=path)
        else:
            error_msg = f"MySQL dump failed: {result.stderr}"
            logger.error(error_msg)
            return format_error_response(error_msg)
            
    except Exception as e:
        logger.error(f"MySQL dump failed: {str(e)}")
        return format_error_response(f"MySQL dump failed: {str(e)}")

def _dump_mongodb(params: Dict[str, Any], path: str) -> Dict[str, Any]:
    """Dump MongoDB database using host mongodump"""
    try:
        uri = params.get('uri')
        database = params.get('database')

        if not uri:
            return format_error_response("MongoDB URI is required")
        # database is optional for MongoDB
        
        if not database:
            return format_error_response("Database name is required for MongoDB dump.")
        
        logger.info(f"MongoDB dump: database: {database}")
        
        # For now, return an error since mongodump is not installed
        # TODO: Install MongoDB tools in the container or use a different approach
        return format_error_response(
            "MongoDB dump is not currently supported. Please install mongodump tools in the container or use a different approach."
        )
        
        # Create output directory
        output_dir = path.replace('.bson', '')
        os.makedirs(os.path.dirname(output_dir), exist_ok=True)
        
        # Build mongodump command
        cmd = f'mongodump --uri "{uri}" --db {database} --out {output_dir}'
        
        # Run the command
        result = _run_host_command(cmd)
        
        if result.returncode == 0:
            logger.info(f"MongoDB dump completed: {output_dir}")
            return format_success_response(f"MongoDB dump completed successfully: {output_dir}", path=output_dir)
        else:
            error_msg = f"MongoDB dump failed: {result.stderr}"
            logger.error(error_msg)
            return format_error_response(error_msg)
            
    except Exception as e:
        logger.error(f"MongoDB dump failed: {str(e)}")
        return format_error_response(f"MongoDB dump failed: {str(e)}")

def _dump_redis(params: Dict[str, Any], path: str) -> Dict[str, Any]:
    """Dump Redis database using host redis-cli"""
    try:
        host = params.get('host', 'localhost')
        port = str(params.get('port', 6379))
        password = params.get('password')
        
        logger.info(f"Redis dump: {host}:{port}")
        
        # Build redis-cli command
        cmd = f"redis-cli -h {host} -p {port}"
        if password:
            cmd += f" -a {password}"
        cmd += f" --rdb {path}"
        
        # Run the command
        result = _run_host_command(cmd)
        
        if result.returncode == 0:
            logger.info(f"Redis dump completed: {path}")
            return format_success_response(f"Redis dump completed successfully: {path}", path=path)
        else:
            error_msg = f"Redis dump failed: {result.stderr}"
            logger.error(error_msg)
            return format_error_response(error_msg)
            
    except Exception as e:
        logger.error(f"Redis dump failed: {str(e)}")
        return format_error_response(f"Redis dump failed: {str(e)}")

def _dump_sqlite(params: Dict[str, Any], path: str) -> Dict[str, Any]:
    """Dump SQLite database by copying the file"""
    try:
        import shutil
        source_db = params['database']
        
        if os.path.exists(source_db):
            shutil.copy2(source_db, path)
            logger.info(f"SQLite dump completed: {path}")
            return format_success_response(f"SQLite dump completed successfully: {path}", path=path)
        else:
            return format_error_response(f"SQLite database file not found: {source_db}")
    except Exception as e:
        logger.error(f"SQLite dump failed: {str(e)}")
        return format_error_response(f"SQLite dump failed: {str(e)}") 