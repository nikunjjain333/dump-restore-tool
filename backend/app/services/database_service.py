import subprocess
import os
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class DatabaseService:
    @staticmethod
    def create_dump(config: dict) -> dict:
        """
        Create a database dump based on the provided configuration.
        
        Args:
            config (dict): Database configuration including connection details
            
        Returns:
            dict: Result of the dump operation
        """
        try:
            db_type = config['db_type']
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            dump_file = os.path.join(
                config['dump_path'],
                f"{config['database']}_{timestamp}.sql"
            )
            
            if db_type == 'postgres':
                cmd = [
                    'pg_dump',
                    '-h', config['host'],
                    '-p', str(config['port']),
                    '-U', config['username'],
                    '-d', config['database'],
                    '-f', dump_file
                ]
                env = os.environ.copy()
                env['PGPASSWORD'] = config['password']
                
            elif db_type == 'mysql':
                cmd = [
                    'mysqldump',
                    f'--host={config["host"]}',
                    f'--port={config["port"]}',
                    f'--user={config["username"]}',
                    f'--password={config["password"]}',
                    '--single-transaction',
                    '--routines',
                    '--triggers',
                    '--events',
                    '--add-drop-database',
                    '--databases', config['database'],
                    f'--result-file={dump_file}'
                ]
                env = None
                
            else:
                raise ValueError(f"Unsupported database type: {db_type}")
            
            # Ensure the directory exists
            os.makedirs(os.path.dirname(dump_file), exist_ok=True)
            
            # Execute the command
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                error_msg = f"Dump failed: {result.stderr}"
                logger.error(error_msg)
                return {
                    'success': False,
                    'error': error_msg,
                    'file_path': None
                }
                
            return {
                'success': True,
                'file_path': dump_file
            }
            
        except Exception as e:
            error_msg = f"Error during database dump: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {
                'success': False,
                'error': error_msg,
                'file_path': None
            }
    
    @staticmethod
    def restore_dump(config: dict, dump_file: str) -> dict:
        """
        Restore a database from a dump file.
        
        Args:
            config (dict): Database configuration including connection details
            dump_file (str): Path to the dump file to restore
            
        Returns:
            dict: Result of the restore operation
        """
        try:
            if not os.path.exists(dump_file):
                return {
                    'success': False,
                    'error': f"Dump file not found: {dump_file}"
                }
                
            db_type = config['db_type']
            
            if db_type == 'postgres':
                cmd = [
                    'psql',
                    '-h', config['host'],
                    '-p', str(config['port']),
                    '-U', config['username'],
                    '-d', config['database'],
                    '-f', dump_file
                ]
                env = os.environ.copy()
                env['PGPASSWORD'] = config['password']
                
            elif db_type == 'mysql':
                cmd = [
                    'mysql',
                    f'--host={config["host"]}',
                    f'--port={config["port"]}',
                    f'--user={config["username"]}',
                    f'--password={config["password"]}',
                    config['database'],
                    f'-e source {dump_file}'
                ]
                env = None
                
            else:
                raise ValueError(f"Unsupported database type: {db_type}")
            
            # Execute the command
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                error_msg = f"Restore failed: {result.stderr}"
                logger.error(error_msg)
                return {
                    'success': False,
                    'error': error_msg
                }
                
            return {
                'success': True
            }
            
        except Exception as e:
            error_msg = f"Error during database restore: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {
                'success': False,
                'error': error_msg
            }
