#!/bin/bash

# GitLab CI/CD Variables Setup Script
# This script helps you set up the required variables for the pipeline

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
    
    if ! command -v curl &> /dev/null; then
        print_error "curl is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed. Please install it first."
        exit 1
    fi
    
    print_status "All prerequisites are met!"
}

# Get GitLab project information
get_project_info() {
    print_header "GitLab Project Information"
    
    echo "Please provide the following information:"
    echo ""
    read -p "GitLab Project ID: " PROJECT_ID
    read -p "GitLab Access Token: " ACCESS_TOKEN
    read -p "GitLab URL (e.g., https://gitlab.com): " GITLAB_URL
    
    # Remove trailing slash from GitLab URL
    GITLAB_URL=${GITLAB_URL%/}
    
    print_status "Project information collected!"
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

# Get notification configuration
get_notification_config() {
    print_header "Notification Configuration"
    
    echo "Please provide notification configuration:"
    echo ""
    read -p "Slack Webhook URL (optional): " SLACK_WEBHOOK_URL
    read -p "Staging URL (optional): " STAGING_URL
    
    print_status "Notification configuration collected!"
}

# Set GitLab variables
set_gitlab_variables() {
    print_header "Setting GitLab CI/CD Variables"
    
    # Define variables to set
    declare -A variables=(
        ["AWS_ACCESS_KEY_ID"]="$AWS_ACCESS_KEY_ID"
        ["AWS_SECRET_ACCESS_KEY"]="$AWS_SECRET_ACCESS_KEY"
        ["AWS_DEFAULT_REGION"]="$AWS_REGION"
        ["APPLICATION_URL"]="$APPLICATION_URL"
        ["ECS_CLUSTER_NAME"]="$ECS_CLUSTER_NAME"
        ["BACKEND_SERVICE_NAME"]="$BACKEND_SERVICE_NAME"
        ["FRONTEND_SERVICE_NAME"]="$FRONTEND_SERVICE_NAME"
    )
    
    # Add optional variables if provided
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        variables["SLACK_WEBHOOK_URL"]="$SLACK_WEBHOOK_URL"
    fi
    
    if [ ! -z "$STAGING_URL" ]; then
        variables["STAGING_URL"]="$STAGING_URL"
    fi
    
    # Set each variable
    for key in "${!variables[@]}"; do
        value="${variables[$key]}"
        
        if [ ! -z "$value" ]; then
            print_status "Setting variable: $key"
            
            # Determine if variable should be protected
            protected="false"
            if [[ "$key" == "AWS_ACCESS_KEY_ID" || "$key" == "AWS_SECRET_ACCESS_KEY" || "$key" == "SLACK_WEBHOOK_URL" ]]; then
                protected="true"
            fi
            
            # Set variable using GitLab API
            response=$(curl -s -w "%{http_code}" -X POST \
                -H "PRIVATE-TOKEN: $ACCESS_TOKEN" \
                -H "Content-Type: application/json" \
                -d "{
                    \"key\": \"$key\",
                    \"value\": \"$value\",
                    \"protected\": $protected,
                    \"masked\": true
                }" \
                "$GITLAB_URL/api/v4/projects/$PROJECT_ID/variables")
            
            http_code="${response: -3}"
            response_body="${response%???}"
            
            if [ "$http_code" -eq 201 ]; then
                print_status "✅ Variable $key set successfully"
            elif [ "$http_code" -eq 400 ]; then
                print_warning "⚠️  Variable $key already exists, updating..."
                
                # Update existing variable
                response=$(curl -s -w "%{http_code}" -X PUT \
                    -H "PRIVATE-TOKEN: $ACCESS_TOKEN" \
                    -H "Content-Type: application/json" \
                    -d "{
                        \"value\": \"$value\",
                        \"protected\": $protected,
                        \"masked\": true
                    }" \
                    "$GITLAB_URL/api/v4/projects/$PROJECT_ID/variables/$key")
                
                http_code="${response: -3}"
                if [ "$http_code" -eq 200 ]; then
                    print_status "✅ Variable $key updated successfully"
                else
                    print_error "❌ Failed to update variable $key"
                fi
            else
                print_error "❌ Failed to set variable $key (HTTP $http_code)"
            fi
        fi
    done
}

# Verify variables are set
verify_variables() {
    print_header "Verifying Variables"
    
    print_status "Fetching current variables..."
    
    response=$(curl -s -H "PRIVATE-TOKEN: $ACCESS_TOKEN" \
        "$GITLAB_URL/api/v4/projects/$PROJECT_ID/variables")
    
    if [ $? -eq 0 ]; then
        echo "Current variables:"
        echo "$response" | jq -r '.[] | "\(.key): \(.value)"' | head -20
        print_status "Variables verification completed!"
    else
        print_error "Failed to verify variables"
    fi
}

# Show next steps
show_next_steps() {
    print_header "Next Steps"
    
    echo "🎉 GitLab CI/CD variables have been set up!"
    echo ""
    echo "Next steps:"
    echo "1. Push your code to GitLab"
    echo "2. Create a merge request to test the pipeline"
    echo "3. Monitor the pipeline in GitLab CI/CD"
    echo "4. Check the deployment in AWS"
    echo ""
    echo "Useful commands:"
    echo "- View pipeline: $GITLAB_URL/$PROJECT_ID/-/pipelines"
    echo "- Check ECS: aws ecs describe-services --cluster $ECS_CLUSTER_NAME"
    echo "- View logs: aws logs tail /ecs/dev-app --follow"
    echo ""
    print_status "Setup completed successfully!"
}

# Main function
main() {
    print_header "GitLab CI/CD Variables Setup"
    
    check_prerequisites
    get_project_info
    get_aws_credentials
    get_app_config
    get_notification_config
    set_gitlab_variables
    verify_variables
    show_next_steps
}

# Run main function
main "$@" 