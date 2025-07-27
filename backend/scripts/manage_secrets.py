#!/usr/bin/env python3
"""
Script to manage secrets for the application
Usage:
    python manage_secrets.py encrypt-local SECRET_NAME SECRET_VALUE
    python manage_secrets.py set-aws SECRET_NAME SECRET_VALUE
    python manage_secrets.py get SECRET_NAME
"""

import sys
import os
import argparse
from pathlib import Path

# Add the parent directory to the path to import our modules
sys.path.append(str(Path(__file__).parent.parent))

from app.core.secrets import secrets_manager


def encrypt_local_secret(secret_name: str, secret_value: str):
    """Encrypt a secret for local storage"""
    success = secrets_manager.set_secret(secret_name, secret_value, use_aws=False)
    if success:
        print(f"✅ Secret {secret_name} encrypted successfully")
        print(f"Add this to your .env file:")
        print(f"{secret_name}_ENCRYPTED=<encrypted_value_from_logs>")
    else:
        print(f"❌ Failed to encrypt secret {secret_name}")


def set_aws_secret(secret_name: str, secret_value: str):
    """Set a secret in AWS Secrets Manager"""
    success = secrets_manager.set_secret(secret_name, secret_value, use_aws=True)
    if success:
        print(f"✅ Secret {secret_name} stored in AWS Secrets Manager")
    else:
        print(f"❌ Failed to store secret {secret_name} in AWS")


def get_secret(secret_name: str):
    """Retrieve a secret"""
    secret_value = secrets_manager.get_secret(secret_name)
    if secret_value:
        print(f"✅ Secret {secret_name}: {secret_value[:4]}{'*' * (len(secret_value) - 4)}")
    else:
        print(f"❌ Secret {secret_name} not found")


def generate_strong_secret(length: int = 32):
    """Generate a strong random secret"""
    import secrets
    import string
    
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def main():
    parser = argparse.ArgumentParser(description="Manage application secrets")
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Encrypt local secret
    encrypt_parser = subparsers.add_parser('encrypt-local', help='Encrypt secret for local storage')
    encrypt_parser.add_argument('secret_name', help='Name of the secret')
    encrypt_parser.add_argument('secret_value', help='Value of the secret')
    
    # Set AWS secret
    aws_parser = subparsers.add_parser('set-aws', help='Set secret in AWS Secrets Manager')
    aws_parser.add_argument('secret_name', help='Name of the secret')
    aws_parser.add_argument('secret_value', help='Value of the secret')
    
    # Get secret
    get_parser = subparsers.add_parser('get', help='Retrieve a secret')
    get_parser.add_argument('secret_name', help='Name of the secret')
    
    # Generate secret
    gen_parser = subparsers.add_parser('generate', help='Generate a strong random secret')
    gen_parser.add_argument('--length', type=int, default=32, help='Length of the secret (default: 32)')
    
    # Setup production secrets
    setup_parser = subparsers.add_parser('setup-production', help='Setup all production secrets')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    if args.command == 'encrypt-local':
        encrypt_local_secret(args.secret_name, args.secret_value)
    elif args.command == 'set-aws':
        set_aws_secret(args.secret_name, args.secret_value)
    elif args.command == 'get':
        get_secret(args.secret_name)
    elif args.command == 'generate':
        secret = generate_strong_secret(args.length)
        print(f"Generated secret: {secret}")
    elif args.command == 'setup-production':
        setup_production_secrets()


def setup_production_secrets():
    """Setup all production secrets interactively"""
    print("🔒 Setting up production secrets...")
    print("Choose your secrets backend:")
    print("1. AWS Secrets Manager (recommended for production)")
    print("2. Encrypted environment variables (for development)")
    
    choice = input("Enter choice (1/2): ").strip()
    use_aws = choice == '1'
    
    if use_aws:
        print("\n📡 Using AWS Secrets Manager")
        print("Make sure you have AWS credentials configured and proper IAM permissions.")
    else:
        print("\n🔐 Using encrypted environment variables")
    
    secrets_to_setup = [
        ('SECRET_KEY', 'Main application secret key'),
        ('JWT_SECRET_KEY', 'JWT signing secret'),
        ('DB_PASSWORD', 'Database password'),
        ('API_KEY', 'API authentication key (optional)'),
    ]
    
    for secret_name, description in secrets_to_setup:
        print(f"\n📝 Setting up {secret_name}: {description}")
        choice = input("Generate random (g) or enter manually (m)? [g/m]: ").strip().lower()
        
        if choice == 'g' or choice == '':
            secret_value = generate_strong_secret()
            print(f"Generated: {secret_value[:8]}...")
        else:
            secret_value = input(f"Enter {secret_name}: ").strip()
        
        success = secrets_manager.set_secret(secret_name, secret_value, use_aws=use_aws)
        if success:
            print(f"✅ {secret_name} set successfully")
        else:
            print(f"❌ Failed to set {secret_name}")
    
    print("\n🎉 Production secrets setup complete!")
    if not use_aws:
        print("Don't forget to update your .env file with the encrypted values from the logs.")


if __name__ == '__main__':
    main()