# AWS Terraform Deployment for Database Dump & Restore Tool

This Terraform configuration deploys the Database Dump & Restore Tool on AWS using a modular architecture with best practices and free tier resources.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Internet      │    │   ALB           │    │   ECS Fargate   │
│                 │────│   (Port 80)     │────│   (Backend)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   ECS Fargate   │    │   RDS           │
                       │   (Frontend)    │    │   PostgreSQL    │
                       └─────────────────┘    └─────────────────┘
```

## Free Tier Resources Used

- **RDS**: db.t3.micro (750 hours/month)
- **ECS Fargate**: 0.25 vCPU, 0.5 GB memory (per task)
- **ALB**: Free tier includes 15 GB data processing
- **NAT Gateway**: 750 hours/month
- **CloudWatch**: 5 custom metrics, 1 million API requests
- **VPC**: Free tier includes 2 VPCs

## Prerequisites

1. **AWS CLI** installed and configured
2. **Terraform** >= 1.0 installed
3. **Docker** for building application images
4. **AWS Account** with appropriate permissions

## Quick Start

### 1. Configure AWS Credentials

```bash
aws configure
```

### 2. Create Terraform Variables File

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 3. Initialize Terraform

```bash
cd terraform
terraform init
```

### 4. Plan the Deployment

```bash
terraform plan
```

### 5. Deploy the Infrastructure

```bash
terraform apply
```

### 6. Build and Push Docker Images

```bash
# Build backend image
docker build -t dump-restore-backend:latest ../backend

# Build frontend image
docker build -t dump-restore-frontend:latest ../frontend

# Tag and push to ECR (if using ECR)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag dump-restore-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/dump-restore-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/dump-restore-backend:latest
```

### 7. Access the Application

After deployment, you can access the application at:
- **Frontend**: http://<alb-dns-name>
- **Backend API**: http://<alb-dns-name>/api
- **API Documentation**: http://<alb-dns-name>/docs

## File Organization

This Terraform configuration follows best practices with separate files for different concerns:

### Core Configuration Files
- **`versions.tf`**: Terraform and provider version constraints
- **`providers.tf`**: AWS provider configuration with default tags
- **`variables.tf`**: Input variable definitions
- **`locals.tf`**: Local values, calculations, and common configurations
- **`data.tf`**: Data sources for AWS resources
- **`main.tf`**: Main orchestration and module calls
- **`outputs.tf`**: Output values for the entire configuration

### Supporting Files
- **`terraform.tfvars.example`**: Example variable values
- **`deploy.sh`**: Automated deployment script
- **`README.md`**: Documentation

## Module Structure

```
terraform/
├── main.tf                 # Main orchestration
├── versions.tf             # Terraform and provider versions
├── providers.tf            # Provider configurations
├── variables.tf            # Variable definitions
├── locals.tf               # Local values and calculations
├── data.tf                 # Data sources
├── outputs.tf              # Output values
├── terraform.tfvars.example # Example variables
├── deploy.sh               # Deployment script
├── README.md              # This file
└── modules/
    ├── vpc/               # VPC and networking
    ├── security_groups/   # Security groups
    ├── rds/              # PostgreSQL database
    ├── ecs/              # ECS cluster and services
    ├── alb/              # Application Load Balancer
    └── cloudwatch/       # Monitoring and logging
```

## Configuration

### Required Variables

- `db_password`: Secure database password
- `aws_region`: AWS region (default: us-east-1)

### Optional Variables

- `environment`: Environment name (default: dev)
- `vpc_cidr`: VPC CIDR block (default: 10.0.0.0/16)
- `availability_zones`: AZs to use (default: us-east-1a, us-east-1b)

## Security Features

- **VPC**: Isolated network with public/private subnets
- **Security Groups**: Restrictive access rules
- **RDS**: Encrypted storage, private subnet placement
- **ECS**: No public IP assignment for tasks
- **ALB**: HTTPS ready (SSL certificate can be added)

## Monitoring

- **CloudWatch Dashboard**: Real-time metrics
- **Alarms**: CPU, memory, and database monitoring
- **Logs**: Centralized logging for all services

## Cost Optimization

- **Free Tier**: All resources configured for free tier limits
- **Auto Scaling**: Can be added for production
- **Reserved Instances**: Consider for production workloads
- **Spot Instances**: Can be used for cost savings

## Troubleshooting

### Common Issues

1. **ECS Service Not Starting**
   - Check task definition logs
   - Verify security group rules
   - Ensure database connectivity

2. **ALB Health Check Failing**
   - Verify target group configuration
   - Check application health endpoints
   - Review security group rules

3. **Database Connection Issues**
   - Verify RDS security group
   - Check database endpoint
   - Ensure correct credentials

### Useful Commands

```bash
# View ECS logs
aws logs describe-log-groups --log-group-name-prefix /ecs/dev

# Check ALB target health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>

# View RDS status
aws rds describe-db-instances --db-instance-identifier dev-db
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete all resources including the database. Ensure you have backups if needed.

## Production Considerations

For production deployments, consider:

1. **High Availability**: Multi-AZ deployment
2. **Auto Scaling**: ECS service auto scaling
3. **SSL/TLS**: HTTPS with ACM certificate
4. **Backup Strategy**: Automated RDS backups
5. **Monitoring**: Enhanced CloudWatch monitoring
6. **Security**: WAF, VPC endpoints
7. **CI/CD**: Automated deployment pipeline

## Support

For issues and questions:
1. Check CloudWatch logs
2. Review Terraform state
3. Verify AWS service limits
4. Check security group configurations 