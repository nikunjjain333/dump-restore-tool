import re
from typing import Any, Dict
from pydantic import validator
import ipaddress
import os
from urllib.parse import urlparse


def validate_string_length(value: str, min_length: int = 1, max_length: int = 255) -> str:
    """Validate string length within bounds"""
    if not isinstance(value, str):
        raise ValueError("Value must be a string")
    
    if len(value) < min_length:
        raise ValueError(f"String must be at least {min_length} characters long")
    
    if len(value) > max_length:
        raise ValueError(f"String must be at most {max_length} characters long")
    
    return value


def validate_alphanumeric_with_special(value: str, allowed_chars: str = "_-") -> str:
    """Validate string contains only alphanumeric characters and specified special chars"""
    pattern = f"^[a-zA-Z0-9{re.escape(allowed_chars)}]+$"
    if not re.match(pattern, value):
        raise ValueError(f"String can only contain letters, numbers, and {allowed_chars}")
    
    return value


def validate_no_path_traversal(value: str) -> str:
    """Validate string doesn't contain path traversal attempts"""
    dangerous_patterns = ["../", "..\\", "/etc/", "/proc/", "/sys/", "/dev/"]
    
    for pattern in dangerous_patterns:
        if pattern in value.lower():
            raise ValueError("Path traversal attempts are not allowed")
    
    return value


def validate_no_sql_injection(value: str) -> str:
    """Basic SQL injection prevention"""
    sql_patterns = [
        r"union\s+select", r"drop\s+table", r"delete\s+from", 
        r"insert\s+into", r"update\s+set", r"exec\s*\(",
        r"xp_cmdshell", r"sp_executesql", r"--", r"/\*", r"\*/"
    ]
    
    for pattern in sql_patterns:
        if re.search(pattern, value.lower()):
            raise ValueError("Potentially dangerous SQL patterns detected")
    
    return value


def validate_hostname_or_ip(value: str) -> str:
    """Validate hostname or IP address"""
    if not value:
        raise ValueError("Hostname or IP cannot be empty")
    
    # Check if it's a valid IP address
    try:
        ipaddress.ip_address(value)
        return value
    except ValueError:
        pass
    
    # Check if it's a valid hostname
    hostname_pattern = r"^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$"
    if not re.match(hostname_pattern, value):
        raise ValueError("Invalid hostname or IP address format")
    
    if len(value) > 253:
        raise ValueError("Hostname too long")
    
    return value


def validate_port(value: int) -> int:
    """Validate port number"""
    if not isinstance(value, int):
        try:
            value = int(value)
        except (ValueError, TypeError):
            raise ValueError("Port must be a valid integer")
    
    if not 1 <= value <= 65535:
        raise ValueError("Port must be between 1 and 65535")
    
    return value


def validate_database_name(value: str) -> str:
    """Validate database name"""
    if not value:
        raise ValueError("Database name cannot be empty")
    
    # Check for dangerous characters
    validate_no_sql_injection(value)
    validate_no_path_traversal(value)
    
    # Database names should be reasonable length and format
    if len(value) > 64:
        raise ValueError("Database name too long (max 64 characters)")
    
    # Allow alphanumeric, underscore, and hyphen
    if not re.match(r"^[a-zA-Z0-9_-]+$", value):
        raise ValueError("Database name can only contain letters, numbers, underscores, and hyphens")
    
    return value


def validate_db_params(db_type: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """Validate database connection parameters based on type"""
    if not isinstance(params, dict):
        raise ValueError("Parameters must be a dictionary")
    
    # Common validations
    if "host" in params and params["host"]:
        params["host"] = validate_hostname_or_ip(str(params["host"]))
    
    if "port" in params and params["port"]:
        params["port"] = validate_port(params["port"])
    
    if "username" in params and params["username"]:
        params["username"] = validate_string_length(str(params["username"]), 1, 64)
        validate_no_sql_injection(params["username"])
    
    if "password" in params and params["password"]:
        params["password"] = validate_string_length(str(params["password"]), 1, 128)
    
    if "database" in params and params["database"]:
        params["database"] = validate_database_name(str(params["database"]))
    
    # Type-specific validations
    if db_type == "postgres":
        required_fields = ["host", "port", "username"]
        for field in required_fields:
            if field not in params or not params[field]:
                raise ValueError(f"PostgreSQL requires {field} parameter")
    
    elif db_type == "mysql":
        required_fields = ["host", "port", "username"]
        for field in required_fields:
            if field not in params or not params[field]:
                raise ValueError(f"MySQL requires {field} parameter")
    
    elif db_type == "mongodb":
        if "host" in params:
            params["host"] = validate_hostname_or_ip(str(params["host"]))
        if "port" in params:
            params["port"] = validate_port(params["port"])
    
    return params


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent security issues"""
    if not filename:
        return filename
    
    # Remove path traversal attempts
    filename = os.path.basename(filename)
    
    # Remove dangerous characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    
    # Limit length
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[:250] + ext
    
    return filename