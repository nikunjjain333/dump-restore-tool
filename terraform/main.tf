# Main Terraform configuration for Database Dump & Restore Tool
# This file orchestrates all modules and their dependencies

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
  azs         = local.availability_zones
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security_groups"
  
  vpc_id = module.vpc.vpc_id
  environment = var.environment
}

# RDS Module (Free Tier: db.t3.micro)
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

# ECS Cluster Module
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

# Application Load Balancer Module
module "alb" {
  source = "./modules/alb"
  
  environment = var.environment
  vpc_id = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  security_group_ids = [module.security_groups.alb_security_group_id]
  
  backend_target_group_arn = module.ecs.backend_target_group_arn
  frontend_target_group_arn = module.ecs.frontend_target_group_arn
}

# CloudWatch Module
module "cloudwatch" {
  source = "./modules/cloudwatch"
  
  environment = var.environment
  ecs_cluster_name = module.ecs.cluster_name
  alb_name = module.alb.alb_name
  rds_identifier = module.rds.db_identifier
} 