# Application URLs and Endpoints
output "application_url" {
  description = "URL of the application"
  value       = "http://${module.alb.alb_dns_name}"
}

output "api_url" {
  description = "URL of the backend API"
  value       = "http://${module.alb.alb_dns_name}/api"
}

output "api_docs_url" {
  description = "URL of the API documentation"
  value       = "http://${module.alb.alb_dns_name}/docs"
}

# Load Balancer Information
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the load balancer"
  value       = module.alb.alb_zone_id
}

# Database Information
output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.db_endpoint
}

output "rds_port" {
  description = "RDS port"
  value       = module.rds.db_port
}

output "rds_identifier" {
  description = "RDS identifier"
  value       = module.rds.db_identifier
}

# ECS Information
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = module.ecs.cluster_arn
}

output "backend_target_group_arn" {
  description = "Backend target group ARN"
  value       = module.ecs.backend_target_group_arn
}

output "frontend_target_group_arn" {
  description = "Frontend target group ARN"
  value       = module.ecs.frontend_target_group_arn
}

# VPC Information
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = module.vpc.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

# Security Groups
output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = module.security_groups.alb_security_group_id
}

output "ecs_security_group_id" {
  description = "ECS security group ID"
  value       = module.security_groups.ecs_security_group_id
}

output "rds_security_group_id" {
  description = "RDS security group ID"
  value       = module.security_groups.rds_security_group_id
}

# CloudWatch Information
output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = module.cloudwatch.dashboard_name
}

output "cloudwatch_dashboard_arn" {
  description = "CloudWatch dashboard ARN"
  value       = module.cloudwatch.dashboard_arn
}

# Deployment Information
output "deployment_info" {
  description = "Deployment information"
  value = {
    environment = var.environment
    region      = var.aws_region
    account_id  = data.aws_caller_identity.current.account_id
    deployment_time = timestamp()
  }
} 