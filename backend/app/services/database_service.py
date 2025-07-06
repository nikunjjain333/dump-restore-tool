import subprocess
import os
import time
import shutil
from datetime import datetime
from typing import Optional, Dict, Any, Tuple, List
import logging
import json
from pathlib import Path

logger = logging.getLogger(__name__)

class DatabaseService:
    _dump_processes: Dict[int, Dict[str, Any]] = {}
    
    @classmethod
    def _get_dump_file_path(cls, config: Dict[str, Any], custom_name: Optional[str] = None) -> str:
        """Generate dump file path with proper extension based on format."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        db_name = config['database']
        dump_dir = Path(config.get('dump_path', os.getcwd()))
        dump_dir.mkdir(parents=True, exist_ok=True)
        
        if custom_name:
            # Use custom name if provided, but ensure it doesn't have extension
            base_name = custom_name.rstrip('.dump').rstrip('.sql')
        else:
            base_name = f"{db_name}_{timestamp}"
            
        if config.get('format') == 'custom':
            return str(dump_dir / f"{base_name}.dump")
        return str(dump_dir / f"{base_name}.sql")

    @classmethod
    def _build_pg_dump_command(cls, config: Dict[str, Any], dump_file: str) -> Tuple[List[str], Dict[str, str]]:
        """Build PostgreSQL dump command."""
        cmd = [
            'pg_dump',
            '-h', config['host'],
            '-p', str(config['port']),
            '-U', config['username'],
            '-d', config['database'],
            '-f', dump_file,
            '--no-password',  # Prevent password prompts
            '--verbose'       # Show progress
        ]
        
        # Add format options
        if config.get('format') == 'custom':
            cmd.extend(['-Fc'])  # Custom format
        else:
            cmd.extend(['-Fp'])  # Plain SQL format
            
        # Add other options
        if config.get('schema_only'):
            cmd.append('-s')
        if config.get('data_only'):
            cmd.append('-a')
            
        env = os.environ.copy()
        env['PGPASSWORD'] = config['password']
        
        return cmd, env

    @classmethod
    def create_dump(cls, config: Dict[str, Any], operation_id: Optional[int] = None, custom_filename: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a database dump based on the provided configuration.
        
        Args:
            config: Database configuration including connection details
            operation_id: Optional operation ID for progress tracking
            custom_filename: Optional custom filename for the dump file
            
        Returns:
            dict: Result of the dump operation
        """
        try:
            # Validate required fields
            required_fields = ['db_type', 'host', 'port', 'username', 'password', 'database']
            for field in required_fields:
                if field not in config:
                    raise ValueError(f"Missing required field: {field}")
            
            # Set default values
            config.setdefault('format', 'custom')  # Default to custom format for better compression
            config.setdefault('dump_path', os.path.expanduser('~/dumps'))  # Default to ~/dumps
            
            # Create dump directory if it doesn't exist
            os.makedirs(config['dump_path'], exist_ok=True)
            
            # Generate dump file path
            dump_file = cls._get_dump_file_path(config, custom_filename)
            
            # Build and execute the appropriate command
            if config['db_type'] == 'postgres':
                cmd, env = cls._build_pg_dump_command(config, dump_file)
            else:
                raise ValueError(f"Unsupported database type: {config['db_type']}")
            
            # Log the command (without password)
            safe_cmd = ' '.join(cmd).replace(config['password'], '*****')
            logger.info(f"Executing dump command: {safe_cmd}")
            
            # Start the process
            process = subprocess.Popen(
                cmd,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,  # Line buffered
                universal_newlines=True
            )
            
            # Store process info for progress tracking
            if operation_id is not None:
                cls._dump_processes[operation_id] = {
                    'process': process,
                    'start_time': time.time(),
                    'dump_file': dump_file,
                    'status': 'running',
                    'progress': 0,
                    'last_update': time.time(),
                    'output': []
                }
            
            # Monitor process output
            stdout_lines = []
            stderr_lines = []
            
            while True:
                # Read output
                stdout_line = process.stdout.readline() if process.stdout else ''
                stderr_line = process.stderr.readline() if process.stderr else ''
                
                if stdout_line:
                    stdout_line = stdout_line.strip()
                    stdout_lines.append(stdout_line)
                    logger.debug(f"STDOUT: {stdout_line}")
                    
                if stderr_line:
                    stderr_line = stderr_line.strip()
                    stderr_lines.append(stderr_line)
                    logger.debug(f"STDERR: {stderr_line}")
                    
                    # Update progress if we can parse it from the output
                    if operation_id in cls._dump_processes:
                        cls._dump_processes[operation_id]['output'].append(stderr_line)
                        cls._dump_processes[operation_id]['last_update'] = time.time()
                        
                        # Simple progress estimation based on output lines
                        if 'processing' in stderr_line.lower():
                            cls._dump_processes[operation_id]['progress'] = min(
                                cls._dump_processes[operation_id]['progress'] + 5, 90
                            )
                
                # Check if process has completed
                if process.poll() is not None:
                    break
                    
                # Small delay to prevent busy waiting
                time.sleep(0.1)
            
            # Get remaining output
            stdout, stderr = process.communicate()
            if stdout:
                stdout_lines.extend(stdout.strip().split('\n'))
            if stderr:
                stderr_lines.extend(stderr.strip().split('\n'))
            
            # Check for errors
            if process.returncode != 0:
                error_msg = '\n'.join(stderr_lines) or 'Unknown error occurred'
                logger.error(f"Dump failed: {error_msg}")
                
                # Clean up partial file if it exists
                if os.path.exists(dump_file):
                    try:
                        os.remove(dump_file)
                    except Exception as e:
                        logger.warning(f"Failed to remove partial dump file: {e}")
                
                # Update process status
                if operation_id in cls._dump_processes:
                    cls._dump_processes[operation_id].update({
                        'status': 'failed',
                        'error': error_msg,
                        'end_time': time.time(),
                        'progress': 100
                    })
                
                return {
                    'success': False,
                    'error': error_msg,
                    'exit_code': process.returncode,
                    'stdout': '\n'.join(stdout_lines),
                    'stderr': '\n'.join(stderr_lines)
                }
            
            # Verify the dump file was created
            if not os.path.exists(dump_file):
                error_msg = "Dump file was not created"
                logger.error(error_msg)
                
                # Update process status
                if operation_id in cls._dump_processes:
                    cls._dump_processes[operation_id].update({
                        'status': 'failed',
                        'error': error_msg,
                        'end_time': time.time(),
                        'progress': 100
                    })
                
                return {
                    'success': False,
                    'error': error_msg,
                    'stdout': '\n'.join(stdout_lines),
                    'stderr': '\n'.join(stderr_lines)
                }
            
            # Get file size
            file_size = os.path.getsize(dump_file)
            
            # Update process status
            if operation_id in cls._dump_processes:
                cls._dump_processes[operation_id].update({
                    'status': 'completed',
                    'progress': 100,
                    'end_time': time.time(),
                    'file_size': file_size,
                    'output': stderr_lines  # Save the full output
                })
            
            return {
                'success': True,
                'dump_file': dump_file,
                'file_size': file_size,
                'stdout': '\n'.join(stdout_lines),
                'stderr': '\n'.join(stderr_lines)
            }
            
        except Exception as e:
            logger.exception("Error creating database dump")
            
            # Update process status if it exists
            if operation_id in cls._dump_processes:
                cls._dump_processes[operation_id].update({
                    'status': 'failed',
                    'error': str(e),
                    'end_time': time.time(),
                    'progress': 100
                })
            
            return {
                'success': False,
                'error': str(e)
            }

    @classmethod
    def get_dump_status(cls, operation_id: int) -> Optional[Dict[str, Any]]:
        """
        Get the status of a dump operation.
        
        Args:
            operation_id: The ID of the operation to check
            
        Returns:
            dict: Status information about the operation, or None if not found
        """
        if operation_id not in cls._dump_processes:
            return None
            
        process_info = cls._dump_processes[operation_id].copy()
        process = process_info.pop('process', None)
        
        # Update status if process is complete
        if process is not None and process.poll() is not None:
            if process.returncode == 0:
                process_info['status'] = 'completed'
                process_info['progress'] = 100
                
                # Get file size if not already set
                if 'file_size' not in process_info and 'dump_file' in process_info:
                    try:
                        process_info['file_size'] = os.path.getsize(process_info['dump_file'])
                    except OSError:
                        process_info['file_size'] = 0
            else:
                process_info['status'] = 'failed'
                process_info['progress'] = 100
                
                # Set error message if not already set
                if 'error' not in process_info:
                    process_info['error'] = f"Process failed with return code {process.returncode}"
            
            # Clean up the process
            if 'process' in cls._dump_processes[operation_id]:
                cls._dump_processes[operation_id]['process'] = None
        
        return process_info
    
    @classmethod
    def cancel_dump(cls, operation_id: int) -> bool:
        """
        Cancel a running dump operation.
        
        Args:
            operation_id: The ID of the operation to cancel
            
        Returns:
            bool: True if the operation was cancelled, False otherwise
        """
        if operation_id not in cls._dump_processes:
            return False
            
        process_info = cls._dump_processes[operation_id]
        process = process_info.get('process')
        
        if process and process.poll() is None:  # Still running
            try:
                process.terminate()
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                try:
                    process.kill()
                except Exception as e:
                    logger.warning(f"Failed to kill process: {e}")
            except Exception as e:
                logger.warning(f"Error terminating process: {e}")
            
            # Clean up the dump file if it exists
            if 'dump_file' in process_info and os.path.exists(process_info['dump_file']):
                try:
                    os.remove(process_info['dump_file'])
                except Exception as e:
                    logger.warning(f"Failed to remove dump file: {e}")
            
            process_info.update({
                'status': 'cancelled',
                'end_time': time.time(),
                'error': 'Operation was cancelled by user',
                'progress': 100
            })
            return True
            
        return False

    @classmethod
    def restore_dump(cls, config: dict, dump_file: str) -> dict:
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
