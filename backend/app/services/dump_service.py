import os
import logging
import subprocess
from typing import Dict, Any, Optional
from .docker_service import get_docker_client

logger = logging.getLogger(__name__)

def _get_alternative_paths(original_path: str) -> list[str]:
    """Get alternative paths that are more likely to be writable"""
    import tempfile
    import os.path
    
    alternatives = []
    
    # Get the filename from the original path
    filename = os.path.basename(original_path)
    if not filename or filename == '.' or filename == '..':
        # If no valid filename, use a default
        filename = "database_dump"
    
    # Add .sql extension if not present
    if not filename.endswith('.sql') and not filename.endswith('.rdb') and not filename.endswith('.db'):
        filename += '.sql'
    
    # Suggest /tmp/ directory
    tmp_path = os.path.join('/tmp', filename)
    alternatives.append(tmp_path)
    
    # Suggest Downloads directory if it exists
    downloads_path = os.path.expanduser('~/Downloads')
    if os.path.exists(downloads_path) and os.access(downloads_path, os.W_OK):
        downloads_file = os.path.join(downloads_path, filename)
        alternatives.append(downloads_file)
    
    # Suggest Desktop directory if it exists
    desktop_path = os.path.expanduser('~/Desktop')
    if os.path.exists(desktop_path) and os.access(desktop_path, os.W_OK):
        desktop_file = os.path.join(desktop_path, filename)
        alternatives.append(desktop_file)
    
    return alternatives

def run_dump(db_type: str, params: Dict[str, Any], path: str, run_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Run database dump operation
    """
    try:
        # Validate path
        if not path or path.strip() == '':
            return {
                "success": False,
                "message": "Dump path cannot be empty"
            }
        
        # Check if the target path already exists as a directory (which would cause issues)
        if os.path.exists(path) and os.path.isdir(path):
            return {
                "success": False,
                "message": f"Path '{path}' already exists as a directory. Please specify a file path instead."
            }
        
        # Don't preemptively create directories - let the file copy operations handle this
        # This avoids "Read-only file system" errors when the directory can't be created
        
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
        
        # Ensure the path has a proper file extension
        if not path.endswith('.sql'):
            if path.endswith('/') or path.endswith('\\'):
                # If path ends with directory separator, append filename
                path = os.path.join(path, f"{database}_dump.sql")
            else:
                # If no extension, append .sql
                path = f"{path}.sql"
        
        # Get the filename from the path to preserve the original extension
        filename = os.path.basename(path)
        
        # Validate that the filename is not empty or just a directory
        if not filename or filename == '.' or filename == '..':
            return {
                "success": False,
                "message": f"Invalid filename extracted from path: {path}"
            }
        
        # Get the directory path for Docker volume mounting
        dir_path = os.path.dirname(path)
        
        # Don't preemptively create directories - let the file copy operations handle this
        # This avoids "Read-only file system" errors when the directory can't be created
        
        logger.info(f"PostgreSQL dump: Using filename '{filename}' for path '{path}' in directory '{dir_path}'")
        
        # First, try to dump to a temporary location that Docker can definitely write to
        temp_filename = f"temp_{filename}"
        temp_path = os.path.join('/tmp', temp_filename)
        
        try:
            # Run pg_dump in Docker container to temporary location
            container = client.containers.run(
                'postgres:16',
                command=f'pg_dump -h {host} -p {port} -U {username} -d {database} -f /tmp/{temp_filename}',
                environment={'PGPASSWORD': password},
                volumes={
                    '/tmp': {'bind': '/tmp', 'mode': 'rw'}
                },
                working_dir=run_path if run_path else '/',
                remove=True,
                detach=False
            )
            
            # If successful, try to copy the file to the desired location
            import shutil
            try:
                # Try to create the directory if it doesn't exist
                target_dir = os.path.dirname(path)
                if target_dir:
                    try:
                        os.makedirs(target_dir, exist_ok=True)
                    except (IOError, OSError) as dir_error:
                        # If directory creation fails, this will be caught by the copy operation
                        logger.warning(f"Could not create directory {target_dir}: {dir_error}")
                
                shutil.copy2(temp_path, path)
                
                # Clean up temporary file
                try:
                    os.remove(temp_path)
                except:
                    pass  # Ignore cleanup errors
                
                return {
                    "success": True,
                    "message": f"PostgreSQL dump completed successfully: {path}",
                    "path": path
                }
                
            except (IOError, OSError) as copy_error:
                # If copy fails, try to copy to a writable location and inform user
                logger.warning(f"Failed to copy to desired location: {copy_error}")
                
                # Try to copy to Downloads as fallback
                fallback_path = os.path.join(os.path.expanduser('~/Downloads'), filename)
                try:
                    shutil.copy2(temp_path, fallback_path)
                    
                    # Clean up temporary file
                    try:
                        os.remove(temp_path)
                    except:
                        pass
                    
                    return {
                        "success": True,
                        "message": f"PostgreSQL dump completed successfully, but could not write to '{path}' due to file system restrictions. File saved to: {fallback_path}",
                        "path": fallback_path
                    }
                    
                except (IOError, OSError) as fallback_error:
                    # If even Downloads fails, try /tmp
                    final_path = os.path.join('/tmp', filename)
                    try:
                        shutil.copy2(temp_path, final_path)
                        
                        # Clean up temporary file
                        try:
                            os.remove(temp_path)
                        except:
                            pass
                        
                        return {
                            "success": True,
                            "message": f"PostgreSQL dump completed successfully, but could not write to '{path}' due to file system restrictions. File saved to: {final_path}",
                            "path": final_path
                        }
                        
                    except (IOError, OSError) as final_error:
                        # If all copy operations fail, return the temp file location
                        return {
                            "success": True,
                            "message": f"PostgreSQL dump completed successfully, but could not copy to desired location due to file system restrictions. File is available at: {temp_path}",
                            "path": temp_path
                        }
            
        except Exception as docker_error:
            # If Docker operation fails, try alternative approach
            error_msg = str(docker_error)
            logger.warning(f"Docker operation failed: {error_msg}")
            
            # Try using a different temporary directory that might work better
            try:
                # Use a different approach - dump to a location that's definitely writable
                alt_temp_path = os.path.join(os.path.expanduser('~/Downloads'), temp_filename)
                
                container = client.containers.run(
                    'postgres:16',
                    command=f'pg_dump -h {host} -p {port} -U {username} -d {database} -f /dump/{temp_filename}',
                    environment={'PGPASSWORD': password},
                    volumes={
                        os.path.expanduser('~/Downloads'): {'bind': '/dump', 'mode': 'rw'}
                    },
                    working_dir=run_path if run_path else '/',
                    remove=True,
                    detach=False
                )
                
                # Copy to desired location
                import shutil
                shutil.copy2(alt_temp_path, path)
                
                # Clean up
                try:
                    os.remove(alt_temp_path)
                except:
                    pass
                
                return {
                    "success": True,
                    "message": f"PostgreSQL dump completed successfully: {path}",
                    "path": path
                }
                
            except Exception as alt_error:
                # If all else fails, provide a helpful error message
                alternatives = _get_alternative_paths(path)
                alt_paths_str = ", ".join(alternatives)
                return {
                    "success": False,
                    "message": f"Unable to write to the specified location '{path}'. This may be due to file system restrictions. Please try one of these alternative paths: {alt_paths_str}. Original error: {error_msg}"
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
        
        # Ensure the path has a proper file extension
        if not path.endswith('.sql'):
            if path.endswith('/') or path.endswith('\\'):
                # If path ends with directory separator, append filename
                path = os.path.join(path, f"{params['database']}_dump.sql")
            else:
                # If no extension, append .sql
                path = f"{path}.sql"
        
        # Get the filename from the path to preserve the original extension
        filename = os.path.basename(path)
        
        # Validate that the filename is not empty or just a directory
        if not filename or filename == '.' or filename == '..':
            return {
                "success": False,
                "message": f"Invalid filename extracted from path: {path}"
            }
        
        # Get the directory path for Docker volume mounting
        dir_path = os.path.dirname(path)
        
        # Don't preemptively create directories - let the file copy operations handle this
        # This avoids "Read-only file system" errors when the directory can't be created
        
        logger.info(f"MySQL dump: Using filename '{filename}' for path '{path}' in directory '{dir_path}'")
        
        # First, try to dump to a temporary location that Docker can definitely write to
        temp_filename = f"temp_{filename}"
        temp_path = os.path.join('/tmp', temp_filename)
        
        # Create mysqldump command
        dump_cmd = f"mysqldump -h {params.get('host', 'localhost')} -P {params.get('port', 3306)} -u {params['username']} -p{params['password']} {params['database']} > /tmp/{temp_filename}"
        
        try:
            # Run mysqldump in Docker container to temporary location
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
            
            # If successful, copy the file to the desired location
            import shutil
            try:
                # Try to create the directory if it doesn't exist
                target_dir = os.path.dirname(path)
                if target_dir:
                    try:
                        os.makedirs(target_dir, exist_ok=True)
                    except (IOError, OSError) as dir_error:
                        # If directory creation fails, this will be caught by the copy operation
                        logger.warning(f"Could not create directory {target_dir}: {dir_error}")
                
                shutil.copy2(temp_path, path)
                
                # Clean up temporary file
                try:
                    os.remove(temp_path)
                except:
                    pass  # Ignore cleanup errors
                
                return {
                    "success": True,
                    "message": f"MySQL dump completed successfully: {path}",
                    "path": path
                }
                
            except (IOError, OSError) as copy_error:
                # If copy fails, try to copy to a writable location and inform user
                logger.warning(f"Failed to copy to desired location: {copy_error}")
                
                # Try to copy to Downloads as fallback
                fallback_path = os.path.join(os.path.expanduser('~/Downloads'), filename)
                try:
                    shutil.copy2(temp_path, fallback_path)
                    
                    # Clean up temporary file
                    try:
                        os.remove(temp_path)
                    except:
                        pass
                    
                    return {
                        "success": True,
                        "message": f"MySQL dump completed successfully, but could not write to '{path}' due to file system restrictions. File saved to: {fallback_path}",
                        "path": fallback_path
                    }
                    
                except (IOError, OSError) as fallback_error:
                    # If even Downloads fails, try /tmp
                    final_path = os.path.join('/tmp', filename)
                    try:
                        shutil.copy2(temp_path, final_path)
                        
                        # Clean up temporary file
                        try:
                            os.remove(temp_path)
                        except:
                            pass
                        
                        return {
                            "success": True,
                            "message": f"MySQL dump completed successfully, but could not write to '{path}' due to file system restrictions. File saved to: {final_path}",
                            "path": final_path
                        }
                        
                    except (IOError, OSError) as final_error:
                        # If all copy operations fail, return the temp file location
                        return {
                            "success": True,
                            "message": f"MySQL dump completed successfully, but could not copy to desired location due to file system restrictions. File is available at: {temp_path}",
                            "path": temp_path
                        }
            
        except Exception as docker_error:
            # If Docker operation fails, try alternative approach
            error_msg = str(docker_error)
            logger.warning(f"Docker operation failed: {error_msg}")
            
            # Try using a different temporary directory that might work better
            try:
                # Use a different approach - dump to a location that's definitely writable
                alt_temp_path = os.path.join(os.path.expanduser('~/Downloads'), temp_filename)
                alt_dump_cmd = f"mysqldump -h {params.get('host', 'localhost')} -P {params.get('port', 3306)} -u {params['username']} -p{params['password']} {params['database']} > /dump/{temp_filename}"
                
                container = client.containers.run(
                    'mysql:8.0',
                    command=f'sh -c "{alt_dump_cmd}"',
                    volumes={
                        os.path.expanduser('~/Downloads'): {'bind': '/dump', 'mode': 'rw'}
                    },
                    working_dir=run_path if run_path else '/',
                    remove=True,
                    detach=False
                )
                
                # Copy to desired location
                import shutil
                shutil.copy2(alt_temp_path, path)
                
                # Clean up
                try:
                    os.remove(alt_temp_path)
                except:
                    pass
                
                return {
                    "success": True,
                    "message": f"MySQL dump completed successfully: {path}",
                    "path": path
                }
                
            except Exception as alt_error:
                # If all else fails, provide a helpful error message
                alternatives = _get_alternative_paths(path)
                alt_paths_str = ", ".join(alternatives)
                return {
                    "success": False,
                    "message": f"Unable to write to the specified location '{path}'. This may be due to file system restrictions. Please try one of these alternative paths: {alt_paths_str}. Original error: {error_msg}"
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
        
        # For MongoDB, ensure the path is a directory
        if not path.endswith('/') and not path.endswith('\\'):
            # If no directory separator, treat as directory name and append separator
            path = f"{path}/"
        
        # Check if the target path already exists as a file (which would cause issues)
        if os.path.exists(path) and os.path.isfile(path):
            return {
                "success": False,
                "message": f"Path '{path}' already exists as a file. Please specify a different directory path."
            }
        
        # Don't preemptively create directories - let the Docker operation handle this
        # This avoids "Read-only file system" errors when the directory can't be created
        
        logger.info(f"MongoDB dump: Using directory '{path}' for dump")
        
        # Create mongodump command
        dump_cmd = f"mongodump --uri '{params['uri']}' --db {params['database']} --out /dump"
        
        container = client.containers.run(
            'mongo:6.0',
            command=f'sh -c "{dump_cmd}"',
            volumes={
                path: {'bind': '/dump', 'mode': 'rw'}
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
        
        # Ensure the path has a proper file extension
        if not path.endswith('.rdb'):
            if path.endswith('/') or path.endswith('\\'):
                # If path ends with directory separator, append filename
                path = os.path.join(path, f"redis_dump.rdb")
            else:
                # If no extension, append .rdb
                path = f"{path}.rdb"
        
        # Get the filename from the path
        filename = os.path.basename(path)
        
        # Validate that the filename is not empty or just a directory
        if not filename or filename == '.' or filename == '..':
            return {
                "success": False,
                "message": f"Invalid filename extracted from path: {path}"
            }
        
        # Get the directory path for Docker volume mounting
        dir_path = os.path.dirname(path)
        
        # Don't preemptively create directories - let the file copy operations handle this
        # This avoids "Read-only file system" errors when the directory can't be created
        
        logger.info(f"Redis dump: Using filename '{filename}' for path '{path}' in directory '{dir_path}'")
        
        # First, try to dump to a temporary location that Docker can definitely write to
        temp_filename = f"temp_{filename}"
        temp_path = os.path.join('/tmp', temp_filename)
        
        # Create redis-cli command for RDB dump
        redis_cmd = f"redis-cli -h {params.get('host', 'localhost')} -p {params.get('port', 6379)}"
        if params.get('password'):
            redis_cmd += f" -a {params['password']}"
        redis_cmd += f" --rdb /tmp/{temp_filename}"
        
        try:
            # Run redis-cli in Docker container to temporary location
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
            
            # If successful, copy the file to the desired location
            import shutil
            try:
                # Try to create the directory if it doesn't exist
                target_dir = os.path.dirname(path)
                if target_dir:
                    try:
                        os.makedirs(target_dir, exist_ok=True)
                    except (IOError, OSError) as dir_error:
                        # If directory creation fails, this will be caught by the copy operation
                        logger.warning(f"Could not create directory {target_dir}: {dir_error}")
                
                shutil.copy2(temp_path, path)
                
                # Clean up temporary file
                try:
                    os.remove(temp_path)
                except:
                    pass  # Ignore cleanup errors
                
                return {
                    "success": True,
                    "message": f"Redis dump completed successfully: {path}",
                    "path": path
                }
                
            except (IOError, OSError) as copy_error:
                # If copy fails, try to copy to a writable location and inform user
                logger.warning(f"Failed to copy to desired location: {copy_error}")
                
                # Try to copy to Downloads as fallback
                fallback_path = os.path.join(os.path.expanduser('~/Downloads'), filename)
                try:
                    shutil.copy2(temp_path, fallback_path)
                    
                    # Clean up temporary file
                    try:
                        os.remove(temp_path)
                    except:
                        pass
                    
                    return {
                        "success": True,
                        "message": f"Redis dump completed successfully, but could not write to '{path}' due to file system restrictions. File saved to: {fallback_path}",
                        "path": fallback_path
                    }
                    
                except (IOError, OSError) as fallback_error:
                    # If even Downloads fails, try /tmp
                    final_path = os.path.join('/tmp', filename)
                    try:
                        shutil.copy2(temp_path, final_path)
                        
                        # Clean up temporary file
                        try:
                            os.remove(temp_path)
                        except:
                            pass
                        
                        return {
                            "success": True,
                            "message": f"Redis dump completed successfully, but could not write to '{path}' due to file system restrictions. File saved to: {final_path}",
                            "path": final_path
                        }
                        
                    except (IOError, OSError) as final_error:
                        # If all copy operations fail, return the temp file location
                        return {
                            "success": True,
                            "message": f"Redis dump completed successfully, but could not copy to desired location due to file system restrictions. File is available at: {temp_path}",
                            "path": temp_path
                        }
            
        except Exception as docker_error:
            # If Docker operation fails, try alternative approach
            error_msg = str(docker_error)
            logger.warning(f"Docker operation failed: {error_msg}")
            
            # Try using a different temporary directory that might work better
            try:
                # Use a different approach - dump to a location that's definitely writable
                alt_temp_path = os.path.join(os.path.expanduser('~/Downloads'), temp_filename)
                alt_redis_cmd = f"redis-cli -h {params.get('host', 'localhost')} -p {params.get('port', 6379)}"
                if params.get('password'):
                    alt_redis_cmd += f" -a {params['password']}"
                alt_redis_cmd += f" --rdb /dump/{temp_filename}"
                
                container = client.containers.run(
                    'redis:7.0',
                    command=f'sh -c "{alt_redis_cmd}"',
                    volumes={
                        os.path.expanduser('~/Downloads'): {'bind': '/dump', 'mode': 'rw'}
                    },
                    working_dir=run_path if run_path else '/',
                    remove=True,
                    detach=False
                )
                
                # Copy to desired location
                import shutil
                shutil.copy2(alt_temp_path, path)
                
                # Clean up
                try:
                    os.remove(alt_temp_path)
                except:
                    pass
                
                return {
                    "success": True,
                    "message": f"Redis dump completed successfully: {path}",
                    "path": path
                }
                
            except Exception as alt_error:
                # If all else fails, provide a helpful error message
                alternatives = _get_alternative_paths(path)
                alt_paths_str = ", ".join(alternatives)
                return {
                    "success": False,
                    "message": f"Unable to write to the specified location '{path}'. This may be due to file system restrictions. Please try one of these alternative paths: {alt_paths_str}. Original error: {error_msg}"
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
        
        # Ensure the path has a proper file extension
        if not path.endswith('.db'):
            if path.endswith('/') or path.endswith('\\'):
                # If path ends with directory separator, append filename
                path = os.path.join(path, f"{params['database']}_dump.db")
            else:
                # If no extension, append .db
                path = f"{path}.db"
        
        # Get the filename from the path
        filename = os.path.basename(path)
        
        # Validate that the filename is not empty or just a directory
        if not filename or filename == '.' or filename == '..':
            return {
                "success": False,
                "message": f"Invalid filename extracted from path: {path}"
            }
        
        logger.info(f"SQLite dump: Using filename '{filename}' for path '{path}'")
        
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