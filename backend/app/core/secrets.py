import os
import json
import logging
from typing import Optional, Dict, Any
from cryptography.fernet import Fernet
import base64
import hashlib

logger = logging.getLogger(__name__)

try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError
    AWS_AVAILABLE = True
except ImportError:
    AWS_AVAILABLE = False
    logger.warning("boto3 not available. AWS Secrets Manager integration disabled.")


class SecretsManager:
    """Unified secrets management supporting multiple backends"""
    
    def __init__(self):
        self.secret_key = self._get_encryption_key()
        self.cipher_suite = Fernet(self.secret_key) if self.secret_key else None
        self.aws_client = self._init_aws_client() if AWS_AVAILABLE else None
        
    def _get_encryption_key(self) -> bytes:
        """Generate or retrieve encryption key for local secrets"""
        key_source = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
        
        # Generate a consistent key from the secret
        key_hash = hashlib.sha256(key_source.encode()).digest()
        return base64.urlsafe_b64encode(key_hash)
    
    def _init_aws_client(self):
        """Initialize AWS Secrets Manager client"""
        try:
            region = os.getenv("AWS_REGION", "us-east-1")
            return boto3.client("secretsmanager", region_name=region)
        except (NoCredentialsError, Exception) as e:
            logger.warning(f"AWS Secrets Manager initialization failed: {e}")
            return None
    
    def get_secret(self, secret_name: str, default: Optional[str] = None) -> Optional[str]:
        """Get secret from the most appropriate source"""
        # Try AWS Secrets Manager first (production)
        if self.aws_client and os.getenv("USE_AWS_SECRETS", "false").lower() == "true":
            secret = self._get_aws_secret(secret_name)
            if secret:
                return secret
        
        # Try encrypted environment variable
        encrypted_var = os.getenv(f"{secret_name}_ENCRYPTED")
        if encrypted_var and self.cipher_suite:
            try:
                return self.cipher_suite.decrypt(encrypted_var.encode()).decode()
            except Exception as e:
                logger.warning(f"Failed to decrypt secret {secret_name}: {e}")
        
        # Fall back to plain environment variable
        return os.getenv(secret_name, default)
    
    def _get_aws_secret(self, secret_name: str) -> Optional[str]:
        """Retrieve secret from AWS Secrets Manager"""
        try:
            response = self.aws_client.get_secret_value(SecretId=secret_name)
            
            if 'SecretString' in response:
                secret_data = json.loads(response['SecretString'])
                return secret_data.get(secret_name)
            else:
                return base64.b64decode(response['SecretBinary']).decode()
                
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code in ['DecryptionFailureException', 'InternalServiceErrorException', 
                             'InvalidParameterException', 'InvalidRequestException', 
                             'ResourceNotFoundException']:
                logger.warning(f"AWS Secrets Manager error for {secret_name}: {error_code}")
            return None
        except Exception as e:
            logger.warning(f"Unexpected error retrieving {secret_name} from AWS: {e}")
            return None
    
    def set_secret(self, secret_name: str, secret_value: str, use_aws: bool = False) -> bool:
        """Store secret securely"""
        if use_aws and self.aws_client:
            return self._set_aws_secret(secret_name, secret_value)
        else:
            return self._set_encrypted_env_secret(secret_name, secret_value)
    
    def _set_aws_secret(self, secret_name: str, secret_value: str) -> bool:
        """Store secret in AWS Secrets Manager"""
        try:
            secret_data = {secret_name: secret_value}
            self.aws_client.create_secret(
                Name=secret_name,
                SecretString=json.dumps(secret_data),
                Description=f"Auto-generated secret for {secret_name}"
            )
            logger.info(f"Secret {secret_name} stored in AWS Secrets Manager")
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceExistsException':
                # Update existing secret
                try:
                    secret_data = {secret_name: secret_value}
                    self.aws_client.update_secret(
                        SecretId=secret_name,
                        SecretString=json.dumps(secret_data)
                    )
                    logger.info(f"Secret {secret_name} updated in AWS Secrets Manager")
                    return True
                except Exception as update_e:
                    logger.error(f"Failed to update secret {secret_name}: {update_e}")
                    return False
            else:
                logger.error(f"Failed to create secret {secret_name}: {e}")
                return False
        except Exception as e:
            logger.error(f"Unexpected error storing {secret_name} in AWS: {e}")
            return False
    
    def _set_encrypted_env_secret(self, secret_name: str, secret_value: str) -> bool:
        """Store encrypted secret (for development/local use)"""
        if not self.cipher_suite:
            logger.error("Encryption not available for local secrets")
            return False
        
        try:
            encrypted_value = self.cipher_suite.encrypt(secret_value.encode()).decode()
            # In production, you'd store this in a secure configuration system
            # For now, we'll just log that it should be set as an environment variable
            logger.info(f"Set environment variable {secret_name}_ENCRYPTED={encrypted_value}")
            return True
        except Exception as e:
            logger.error(f"Failed to encrypt secret {secret_name}: {e}")
            return False
    
    def get_database_url(self) -> str:
        """Get database URL with secrets support"""
        # Try to get individual components
        db_host = self.get_secret("DB_HOST", "db")
        db_port = self.get_secret("DB_PORT", "5432")
        db_name = self.get_secret("DB_NAME", "dump_restore")
        db_user = self.get_secret("DB_USER", "postgres")
        db_password = self.get_secret("DB_PASSWORD", "postgres")
        
        # If we have all components, build the URL
        if all([db_host, db_port, db_name, db_user, db_password]):
            return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        
        # Fall back to DATABASE_URL
        return self.get_secret("DATABASE_URL", 
                              "postgresql://postgres:postgres@db:5433/dump_restore")
    
    def get_api_keys(self) -> Dict[str, Optional[str]]:
        """Get API keys and tokens"""
        return {
            "jwt_secret": self.get_secret("JWT_SECRET_KEY", "your-jwt-secret-change-in-production"),
            "api_key": self.get_secret("API_KEY"),
            "webhook_secret": self.get_secret("WEBHOOK_SECRET"),
        }


# Global instance
secrets_manager = SecretsManager()


def get_secret(secret_name: str, default: Optional[str] = None) -> Optional[str]:
    """Convenience function to get secrets"""
    return secrets_manager.get_secret(secret_name, default)