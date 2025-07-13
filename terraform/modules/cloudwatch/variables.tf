variable "environment" {
  description = "Environment name"
  type        = string
}

variable "ecs_cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "alb_name" {
  description = "ALB name"
  type        = string
}

variable "rds_identifier" {
  description = "RDS identifier"
  type        = string
} 