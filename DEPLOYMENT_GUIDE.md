# Database Dump & Restore Tool - Deployment Guide

This guide provides comprehensive instructions for deploying the Database Dump & Restore Tool on AWS using Terraform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Local Development Setup](#local-development-setup)
4. [AWS Deployment](#aws-deployment)
5. [Monitoring and Maintenance](#monitoring-and-maintenance)
6. [Troubleshooting](#troubleshooting)
7. [Production Considerations](#production-considerations)

## Prerequisites

### Required Software

- **AWS CLI** (v2.x)
- **Terraform** (>= 1.0)
- **Docker** (>= 20.10)
- **Git** (>= 2.0)

### AWS Account Setup

1. **Create AWS Account**
   - Sign up for AWS account
   - Enable MFA for root user
   - Create IAM user with appropriate permissions

2. **Configure AWS CLI**
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Enter your default region (e.g., us-east-1)
   # Enter your output format (json)
   ```

3. **Required IAM Permissions**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "ec2:*",
           "ecs:*",
           "rds:*",
           "elasticloadbalancing:*",
           "cloudwatch:*",
           "logs:*",
           "iam:*",
           "ecr:*"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

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

### Components

- **VPC**: Isolated network with public/private subnets
- **ALB**: Application Load Balancer for traffic distribution
- **ECS Fargate**: Containerized application services
- **RDS**: PostgreSQL database
- **CloudWatch**: Monitoring and logging
- **Security Groups**: Network security rules

### Free Tier Resources

- **RDS**: db.t3.micro (750 hours/month)
- **ECS Fargate**: 0.25 vCPU, 0.5 GB memory per task
- **ALB**: 15 GB data processing
- **NAT Gateway**: 750 hours/month
- **CloudWatch**: 5 custom metrics, 1M API requests

## Local Development Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd dump-restore-tool
```

### 2. Start Local Development

```bash
# Start all services
./start.sh

# Or manually
docker-compose up --build -d
```

### 3. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## AWS Deployment

### 1. Prepare Terraform Configuration

```bash
cd terraform

# Copy and edit variables
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
aws_region = "us-east-1"
environment = "dev"
db_password = "your-secure-password-here"
```

### 2. Deploy Infrastructure

#### Option A: Using Deployment Script (Recommended)

```bash
# Deploy everything
./deploy.sh deploy

# Clean up
./deploy.sh cleanup
```

#### Option B: Manual Deployment

```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply deployment
terraform apply

# Build and push Docker images
docker build -t dump-restore-backend:latest ../backend
docker build -t dump-restore-frontend:latest ../frontend
```

### 3. Configure ECR (Optional)

For production, use Amazon ECR for container images:

```bash
# Create ECR repositories
aws ecr create-repository --repository-name dump-restore-backend
aws ecr create-repository --repository-name dump-restore-frontend

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push images
docker tag dump-restore-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/dump-restore-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/dump-restore-backend:latest
```

### 4. Access Deployed Application

After deployment, get the application URL:

```bash
terraform output application_url
```

## Monitoring and Maintenance

### CloudWatch Dashboard

Access the CloudWatch dashboard to monitor:
- ECS cluster metrics (CPU, memory)
- ALB metrics (requests, response time)
- RDS metrics (CPU, connections)

### Logs

View application logs:

```bash
# ECS logs
aws logs describe-log-groups --log-group-name-prefix /ecs/dev

# View specific log stream
aws logs tail /ecs/dev-app --follow
```

### Alarms

The deployment includes CloudWatch alarms for:
- High CPU usage (>80%)
- High memory usage (>80%)
- RDS CPU usage (>80%)

### Scaling

For production, consider:

1. **ECS Auto Scaling**
   ```hcl
   resource "aws_appautoscaling_target" "ecs_target" {
     max_capacity       = 4
     min_capacity       = 1
     resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.backend.name}"
     scalable_dimension = "ecs:service:DesiredCount"
     service_namespace  = "ecs"
   }
   ```

2. **RDS Scaling**
   - Enable Multi-AZ for high availability
   - Use larger instance types for production

## Troubleshooting

### Common Issues

#### 1. ECS Service Not Starting

**Symptoms**: Service stuck in PENDING state

**Solutions**:
```bash
# Check task definition
aws ecs describe-task-definition --task-definition dev-backend

# Check service events
aws ecs describe-services --cluster dev-cluster --services dev-backend-service

# View logs
aws logs tail /ecs/dev-app --follow
```

#### 2. ALB Health Check Failing

**Symptoms**: Targets unhealthy

**Solutions**:
```bash
# Check target health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>

# Verify security groups
aws ec2 describe-security-groups --group-ids <security-group-id>

# Test connectivity
aws ec2 describe-instances --filters "Name=tag:Name,Values=*ecs*"
```

#### 3. Database Connection Issues

**Symptoms**: Application can't connect to RDS

**Solutions**:
```bash
# Check RDS status
aws rds describe-db-instances --db-instance-identifier dev-db

# Verify security group rules
aws ec2 describe-security-groups --group-ids <rds-security-group-id>

# Test connectivity from ECS
aws ecs run-task --cluster dev-cluster --task-definition dev-backend --network-configuration "awsvpcConfiguration={subnets=[<subnet-id>],securityGroups=[<security-group-id>],assignPublicIp=ENABLED}"
```

### Useful Commands

```bash
# Get deployment outputs
terraform output

# View ECS services
aws ecs list-services --cluster dev-cluster

# Check ALB target health
aws elbv2 describe-target-health --target-group-arn $(terraform output -raw backend_target_group_arn)

# View RDS status
aws rds describe-db-instances --db-instance-identifier dev-db

# Monitor CloudWatch metrics
aws cloudwatch get-metric-statistics --namespace AWS/ECS --metric-name CPUUtilization --dimensions Name=ClusterName,Value=dev-cluster --start-time $(date -d '1 hour ago' --iso-8601=seconds) --end-time $(date --iso-8601=seconds) --period 300 --statistics Average
```

## Production Considerations

### Security Enhancements

1. **SSL/TLS Certificate**
   ```hcl
   resource "aws_acm_certificate" "main" {
     domain_name       = "your-domain.com"
     validation_method = "DNS"
   }
   ```

2. **WAF Protection**
   ```hcl
   resource "aws_wafv2_web_acl" "main" {
     name        = "${var.environment}-waf"
     description = "WAF for ALB"
     scope       = "REGIONAL"
   }
   ```

3. **VPC Endpoints**
   ```hcl
   resource "aws_vpc_endpoint" "s3" {
     vpc_id       = module.vpc.vpc_id
     service_name = "com.amazonaws.${data.aws_region.current.name}.s3"
   }
   ```

### High Availability

1. **Multi-AZ RDS**
   ```hcl
   resource "aws_db_instance" "main" {
     multi_az = true
   }
   ```

2. **ECS Service Auto Scaling**
   ```hcl
   resource "aws_appautoscaling_target" "ecs_target" {
     max_capacity = 4
     min_capacity = 2
   }
   ```

3. **ALB in Multiple AZs**
   ```hcl
   resource "aws_lb" "main" {
     subnets = module.vpc.public_subnet_ids
   }
   ```

### Backup Strategy

1. **RDS Automated Backups**
   ```hcl
   resource "aws_db_instance" "main" {
     backup_retention_period = 7
     backup_window          = "03:00-04:00"
   }
   ```

2. **S3 Backup Storage**
   ```hcl
   resource "aws_s3_bucket" "backups" {
     bucket = "${var.environment}-backups-${random_id.bucket.hex}"
   }
   ```

### CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v1
      
      - name: Deploy to AWS
        run: |
          cd terraform
          terraform init
          terraform apply -auto-approve
```

## Cost Optimization

### Free Tier Monitoring

- Monitor usage in AWS Billing Dashboard
- Set up billing alerts
- Use AWS Cost Explorer for analysis

### Cost Optimization Tips

1. **Use Spot Instances** for non-critical workloads
2. **Reserved Instances** for predictable workloads
3. **S3 Lifecycle Policies** for backup storage
4. **CloudWatch Logs Retention** policies
5. **RDS Storage Optimization**

### Estimated Costs (Free Tier)

- **RDS**: $0 (750 hours/month)
- **ECS**: $0 (750 hours/month)
- **ALB**: $0 (15 GB data processing)
- **NAT Gateway**: $0 (750 hours/month)
- **CloudWatch**: $0 (basic monitoring)

**Total**: $0/month (within free tier limits)

## Support

For issues and questions:

1. **Check CloudWatch logs** for application errors
2. **Review Terraform state** for infrastructure issues
3. **Verify AWS service limits** in your account
4. **Check security group configurations**
5. **Monitor CloudWatch alarms** for performance issues

### Useful Resources

- [AWS Free Tier](https://aws.amazon.com/free/)
- [Terraform Documentation](https://www.terraform.io/docs)
- [ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [RDS Documentation](https://docs.aws.amazon.com/rds/) 