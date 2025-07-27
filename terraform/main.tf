# 🆓 FREE Database Dump & Restore Tool - AWS Deployment
# Optimized for AWS Free Tier - $0.00/month cost
# All resources configured to stay within free tier limits permanently

# VPC Module (FREE: Always free - subnets, route tables, security groups)
module "vpc" {
  source = "./modules/vpc"
  
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
  azs         = local.availability_zones
}

# Security Groups Module (FREE: Always free)
module "security_groups" {
  source = "./modules/security_groups"
  
  vpc_id = module.vpc.vpc_id
  environment = var.environment
}

# RDS Module (FREE: db.t3.micro, 750 hours/month, 20GB storage)
module "rds" {
  source = "./modules/rds"
  
  environment = var.environment
  vpc_id = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.rds_security_group_id]
  
  db_name = var.db_name
  db_username = var.db_username
  db_password = var.db_password
}

# ECS Cluster Module (FREE: Fargate 0.25 vCPU, 0.5GB memory, 400k GB-seconds/month)
module "ecs" {
  source = "./modules/ecs"
  
  environment = var.environment
  vpc_id = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  private_subnet_ids = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.ecs_security_group_id]
  
  db_host = module.rds.db_endpoint
  db_name = var.db_name
  db_username = var.db_username
  db_password = var.db_password
  app_name = var.app_name
  app_version = var.app_version
  alb_dns_name = module.alb.alb_dns_name
}

# Application Load Balancer Module (FREE: 750 hours/month + 15GB data processing)
module "alb" {
  source = "./modules/alb"
  
  environment = var.environment
  vpc_id = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  security_group_ids = [module.security_groups.alb_security_group_id]
  
  backend_target_group_arn = module.ecs.backend_target_group_arn
  frontend_target_group_arn = module.ecs.frontend_target_group_arn
}

# CloudWatch Module (FREE: 10 alarms, 5GB logs, 1M API requests - no dashboard)
module "cloudwatch" {
  source = "./modules/cloudwatch"
  
  environment = var.environment
  ecs_cluster_name = module.ecs.cluster_name
  alb_name = module.alb.alb_name
  rds_identifier = module.rds.db_identifier
}