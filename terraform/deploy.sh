#!/bin/bash

# Database Dump & Restore Tool - AWS Deployment Script
# This script automates the deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials are not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    print_status "All prerequisites are met!"
}

# Initialize Terraform
init_terraform() {
    print_status "Initializing Terraform..."
    terraform init
    print_status "Terraform initialized successfully!"
}

# Validate Terraform configuration
validate_terraform() {
    print_status "Validating Terraform configuration..."
    terraform validate
    print_status "Terraform configuration is valid!"
}

# Plan Terraform deployment
plan_terraform() {
    print_status "Planning Terraform deployment..."
    terraform plan -out=tfplan
    print_status "Terraform plan created successfully!"
}

# Apply Terraform deployment
apply_terraform() {
    print_status "Applying Terraform deployment..."
    terraform apply tfplan
    print_status "Terraform deployment completed successfully!"
}

# Build Docker images
build_images() {
    print_status "Building Docker images..."
    
    # Build backend image
    print_status "Building backend image..."
    docker build -t dump-restore-backend:latest ../backend
    
    # Build frontend image
    print_status "Building frontend image..."
    docker build -t dump-restore-frontend:latest ../frontend
    
    print_status "Docker images built successfully!"
}

# Get deployment outputs
get_outputs() {
    print_status "Getting deployment outputs..."
    
    ALB_DNS=$(terraform output -raw alb_dns_name)
    RDS_ENDPOINT=$(terraform output -raw rds_endpoint)
    ECS_CLUSTER=$(terraform output -raw ecs_cluster_name)
    
    echo ""
    print_status "Deployment completed successfully!"
    echo ""
    echo "Application URL: http://$ALB_DNS"
    echo "RDS Endpoint: $RDS_ENDPOINT"
    echo "ECS Cluster: $ECS_CLUSTER"
    echo ""
    print_warning "Note: It may take a few minutes for the ECS services to start up."
    print_warning "You can monitor the deployment in the AWS Console."
}

# Main deployment function
deploy() {
    print_status "Starting deployment process..."
    
    check_prerequisites
    init_terraform
    validate_terraform
    plan_terraform
    
    print_warning "Review the plan above. Press Enter to continue or Ctrl+C to cancel..."
    read -r
    
    apply_terraform
    build_images
    get_outputs
}

# Cleanup function
cleanup() {
    print_status "Starting cleanup process..."
    
    print_warning "This will destroy all resources. Are you sure? (y/N)"
    read -r response
    
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        terraform destroy -auto-approve
        print_status "Cleanup completed successfully!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy    Deploy the application to AWS"
    echo "  cleanup   Destroy all resources"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy"
    echo "  $0 cleanup"
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac 