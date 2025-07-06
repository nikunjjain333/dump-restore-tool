import os
import logging
import subprocess
from typing import Dict, Any
from .docker_service import get_docker_client

logger = logging.getLogger(__name__)

def run_restore(db_type: str, params: Dict[str, Any], path: str, run_path: str) -> Dict[str, Any]:
    """
    Run database restore operation
    """
    try:
        # Check if restore file exists
        if not os.path.exists(path):
            return {
                "success": False,
                "message": f"Restore file not found: {path}"
            }
        
        if db_type == 'postgres':
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

def _restore_postgres(params: Dict[str, Any], path: str, run_path: str) -> Dict[str, Any]:
    """Restore PostgreSQL database"""
    try:
        client = get_docker_client()
        
        # Create environment variables for PostgreSQL connection
        env_vars = {
            'PGHOST': params.get('host', 'localhost'),
            'PGPORT': str(params.get('port', 5432)),
            'PGDATABASE': params['database'],
            'PGUSER': params['username'],
            'PGPASSWORD': params['password']
        }
        
        # Run psql restore in Docker container
        container = client.containers.run(
            'postgres:15',
            command=f'psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f /restore/input.sql',
            environment=env_vars,
            volumes={
                os.path.dirname(path): {'bind': '/restore', 'mode': 'rw'}
            },
            working_dir=run_path if run_path else '/',
            remove=True,
            detach=False
        )
        
        return {
            "success": True,
            "message": f"PostgreSQL restore completed successfully from: {path}",
            "path": path
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"PostgreSQL restore failed: {str(e)}"
        }

def _restore_mysql(params: Dict[str, Any], path: str, run_path: str) -> Dict[str, Any]:
    """Restore MySQL database"""
    try:
        client = get_docker_client()
        
        # Create mysql restore command
        restore_cmd = f"mysql -h {params.get('host', 'localhost')} -P {params.get('port', 3306)} -u {params['username']} -p{params['password']} {params['database']} < /restore/input.sql"
        
        container = client.containers.run(
            'mysql:8.0',
            command=f'sh -c "{restore_cmd}"',
            volumes={
                os.path.dirname(path): {'bind': '/restore', 'mode': 'rw'}
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

def _restore_mongodb(params: Dict[str, Any], path: str, run_path: str) -> Dict[str, Any]:
    """Restore MongoDB database"""
    try:
        client = get_docker_client()
        
        # Create mongorestore command
        restore_cmd = f"mongorestore --uri '{params['uri']}' --db {params['database']} /restore/{params['database']}"
        
        container = client.containers.run(
            'mongo:6.0',
            command=f'sh -c "{restore_cmd}"',
            volumes={
                os.path.dirname(path): {'bind': '/restore', 'mode': 'rw'}
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

def _restore_redis(params: Dict[str, Any], path: str, run_path: str) -> Dict[str, Any]:
    """Restore Redis database"""
    try:
        client = get_docker_client()
        
        # For Redis, we need to stop the server, replace the RDB file, and restart
        # This is a simplified approach - in production you might want more sophisticated handling
        
        # Copy the RDB file to Redis data directory
        redis_cmd = f"cp /restore/dump.rdb /data/dump.rdb"
        
        container = client.containers.run(
            'redis:7.0',
            command=f'sh -c "{redis_cmd}"',
            volumes={
                os.path.dirname(path): {'bind': '/restore', 'mode': 'rw'},
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

def _restore_sqlite(params: Dict[str, Any], path: str, run_path: str) -> Dict[str, Any]:
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