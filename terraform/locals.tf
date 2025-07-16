locals {
  # Common tags for all resources
  common_tags = {
    Environment = var.environment
    Project     = "dump-restore-tool"
    ManagedBy   = "terraform"
    Owner       = "devops"
  }

  # Resource naming
  name_prefix = "${var.environment}-dump-restore"

  # Availability zones (limit to 2 for cost optimization)
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 2)

  # CIDR blocks for subnets
  public_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 8, 0),
    cidrsubnet(var.vpc_cidr, 8, 1)
  ]

  private_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 8, 2),
    cidrsubnet(var.vpc_cidr, 8, 3)
  ]

  # Database configuration
  db_config = {
    engine         = "postgres"
    engine_version = "16.1"
    instance_class = "db.t3.micro" # Free tier
    allocated_storage = 20
    max_allocated_storage = 100
  }

  # ECS configuration
  ecs_config = {
    cpu    = 256  # 0.25 vCPU (Free tier)
    memory = 512  # 0.5 GB (Free tier)
  }

  # Application configuration
  app_config = {
    backend_port = 8000
    frontend_port = 3001
    health_check_path = "/health"
  }
} 