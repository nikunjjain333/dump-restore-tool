# 🆓 AWS Free Tier Configuration
# Optimized for completely free deployment

# AWS Configuration
aws_region = "us-east-1"  # Best free tier resource availability
environment = "free"       # Environment name for free tier

# VPC Configuration (Free)
vpc_cidr = "10.0.0.0/16"

# Database Configuration (Free Tier: db.t3.micro)
db_name = "dump_restore"
db_username = "postgres"
db_password = "YourSecurePassword123!"  # CHANGE THIS!

# Application Configuration
app_name = "free-db-tool"
app_version = "latest"
container_port = 8001
frontend_port = 3001

# Free Tier Optimization Notes:
# - RDS: db.t3.micro (750 hours/month free)
# - ECS: 0.25 vCPU, 0.5GB memory (within free tier limits)
# - ALB: 750 hours/month + 15GB data processing free
# - CloudWatch: 10 metrics, 5GB logs, 1M API requests free
# - VPC: NAT Gateway 750 hours/month free

# Estimated Monthly Cost: $0.00 (within free tier limits)