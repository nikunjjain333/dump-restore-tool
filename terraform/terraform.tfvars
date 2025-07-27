# 🆓 AWS Free Tier Configuration
# Optimized for completely free deployment - $0.00/month!

# AWS Configuration
aws_region = "us-east-1"  # Best free tier availability
environment = "free"      # Use 'free' for free tier deployment

# VPC Configuration (Always Free)
vpc_cidr = "10.0.0.0/16"

# Database Configuration (FREE: db.t3.micro - 750 hours/month)
db_name = "dump_restore"
db_username = "postgres"
db_password = "postgres"  # CHANGE THIS TO YOUR OWN PASSWORD!

# Application Configuration
app_name = "free-db-tool"
app_version = "latest"
container_port = 8001
frontend_port = 3001

# Free Tier Resources Used:
# - RDS db.t3.micro: 750 hours/month (12 months free)
# - ECS Fargate: 0.25 vCPU, 0.5GB memory (400k GB-seconds/month)
# - ALB: 750 hours/month + 15GB data processing
# - CloudWatch: 10 metrics, 5GB logs, 1M API requests
# - VPC resources: Always free
# Estimated cost: $0.00/month