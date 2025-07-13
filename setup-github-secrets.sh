#!/bin/bash

# GitHub Actions Secrets Setup Script
# This script helps you set up the required secrets for the pipeline

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) is not installed. Please install it first."
        echo "Installation instructions: https://cli.github.com/"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed. Please install it first."
        exit 1
    fi
    
    print_status "All prerequisites are met!"
}

# Get GitHub repository information
get_repo_info() {
    print_header "GitHub Repository Information"
    
    echo "Please provide the following information:"
    echo ""
    read -p "GitHub Repository (owner/repo): " REPO_NAME
    
    # Validate repository format
    if [[ ! "$REPO_NAME" =~ ^[^/]+/[^/]+$ ]]; then
        print_error "Invalid repository format. Please use 'owner/repo' format."
        exit 1
    fi
    
    print_status "Repository information collected!"
}

# Get AWS credentials
get_aws_credentials() {
    print_header "AWS Credentials"
    
    echo "Please provide your AWS credentials:"
    echo ""
    read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
    read -s -p "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
    echo ""
    read -p "AWS Region (default: us-east-1): " AWS_REGION
    
    AWS_REGION=${AWS_REGION:-us-east-1}
    
    print_status "AWS credentials collected!"
}

# Get application configuration
get_app_config() {
    print_header "Application Configuration"
    
    echo "Please provide application configuration:"
    echo ""
    read -p "Application URL (e.g., https://your-app.com): " APPLICATION_URL
    read -p "ECS Cluster Name (default: dev-cluster): " ECS_CLUSTER_NAME
    read -p "Backend Service Name (default: dev-backend-service): " BACKEND_SERVICE_NAME
    read -p "Frontend Service Name (default: dev-frontend-service): " FRONTEND_SERVICE_NAME
    
    ECS_CLUSTER_NAME=${ECS_CLUSTER_NAME:-dev-cluster}
    BACKEND_SERVICE_NAME=${BACKEND_SERVICE_NAME:-dev-backend-service}
    FRONTEND_SERVICE_NAME=${FRONTEND_SERVICE_NAME:-dev-frontend-service}
    
    print_status "Application configuration collected!"
}

# Get ECR configuration
get_ecr_config() {
    print_header "ECR Configuration"
    
    echo "Please provide ECR configuration:"
    echo ""
    read -p "AWS Account ID: " AWS_ACCOUNT_ID
    read -p "ECR Registry URL (e.g., $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com): " ECR_REGISTRY
    
    ECR_REGISTRY=${ECR_REGISTRY:-$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com}
    
    print_status "ECR configuration collected!"
}

# Get notification configuration
get_notification_config() {
    print_header "Notification Configuration"
    
    echo "Please provide notification configuration:"
    echo ""
    read -p "Slack Webhook URL (optional): " SLACK_WEBHOOK_URL
    read -p "Staging URL (optional): " STAGING_URL
    
    print_status "Notification configuration collected!"
}

# Set GitHub secrets
set_github_secrets() {
    print_header "Setting GitHub Secrets"
    
    # Check if user is authenticated with GitHub CLI
    if ! gh auth status &> /dev/null; then
        print_error "You are not authenticated with GitHub CLI. Please run 'gh auth login' first."
        exit 1
    fi
    
    # Define secrets to set
    declare -A secrets=(
        ["AWS_ACCESS_KEY_ID"]="$AWS_ACCESS_KEY_ID"
        ["AWS_SECRET_ACCESS_KEY"]="$AWS_SECRET_ACCESS_KEY"
        ["AWS_DEFAULT_REGION"]="$AWS_REGION"
        ["ECR_REGISTRY"]="$ECR_REGISTRY"
        ["APPLICATION_URL"]="$APPLICATION_URL"
        ["ECS_CLUSTER_NAME"]="$ECS_CLUSTER_NAME"
        ["BACKEND_SERVICE_NAME"]="$BACKEND_SERVICE_NAME"
        ["FRONTEND_SERVICE_NAME"]="$FRONTEND_SERVICE_NAME"
    )
    
    # Add optional secrets if provided
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        secrets["SLACK_WEBHOOK_URL"]="$SLACK_WEBHOOK_URL"
    fi
    
    if [ ! -z "$STAGING_URL" ]; then
        secrets["STAGING_URL"]="$STAGING_URL"
    fi
    
    # Set each secret
    for key in "${!secrets[@]}"; do
        value="${secrets[$key]}"
        
        if [ ! -z "$value" ]; then
            print_status "Setting secret: $key"
            
            # Set secret using GitHub CLI
            if echo "$value" | gh secret set "$key" --repo "$REPO_NAME"; then
                print_status "✅ Secret $key set successfully"
            else
                print_error "❌ Failed to set secret $key"
            fi
        fi
    done
}

# Verify secrets are set
verify_secrets() {
    print_header "Verifying Secrets"
    
    print_status "Fetching current secrets..."
    
    # List secrets (note: values are masked for security)
    if gh secret list --repo "$REPO_NAME"; then
        print_status "Secrets verification completed!"
    else
        print_error "Failed to verify secrets"
    fi
}

# Create ECR repositories
create_ecr_repositories() {
    print_header "Creating ECR Repositories"
    
    echo "Do you want to create ECR repositories for backend and frontend? (y/n)"
    read -p "Create ECR repositories: " CREATE_ECR
    
    if [[ "$CREATE_ECR" =~ ^[Yy]$ ]]; then
        print_status "Creating ECR repositories..."
        
        # Configure AWS CLI
        aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
        aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
        aws configure set default.region "$AWS_REGION"
        
        # Create repositories
        if aws ecr create-repository --repository-name backend --region "$AWS_REGION" 2>/dev/null; then
            print_status "✅ Backend ECR repository created"
        else
            print_warning "⚠️  Backend ECR repository already exists"
        fi
        
        if aws ecr create-repository --repository-name frontend --region "$AWS_REGION" 2>/dev/null; then
            print_status "✅ Frontend ECR repository created"
        else
            print_warning "⚠️  Frontend ECR repository already exists"
        fi
        
        print_status "ECR repositories setup completed!"
    else
        print_status "Skipping ECR repository creation"
    fi
}

# Show next steps
show_next_steps() {
    print_header "Next Steps"
    
    echo "🎉 GitHub Actions secrets have been set up!"
    echo ""
    echo "Next steps:"
    echo "1. Push your code to GitHub"
    echo "2. Create a pull request to test the pipeline"
    echo "3. Monitor the workflow in GitHub Actions"
    echo "4. Check the deployment in AWS"
    echo ""
    echo "Useful commands:"
    echo "- View workflows: https://github.com/$REPO_NAME/actions"
    echo "- Check ECS: aws ecs describe-services --cluster $ECS_CLUSTER_NAME"
    echo "- View logs: aws logs tail /ecs/dev-app --follow"
    echo ""
    echo "Workflow files:"
    echo "- Main workflow: .github/workflows/ci-cd.yml"
    echo ""
    print_status "Setup completed successfully!"
}

# Main function
main() {
    print_header "GitHub Actions Secrets Setup"
    
    check_prerequisites
    get_repo_info
    get_aws_credentials
    get_app_config
    get_ecr_config
    get_notification_config
    set_github_secrets
    verify_secrets
    create_ecr_repositories
    show_next_steps
}

# Run main function
main "$@" 