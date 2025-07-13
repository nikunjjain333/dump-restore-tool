# AWS Account and Region Information
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# Availability Zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Latest Amazon Linux 2 AMI (for NAT instance if needed)
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Latest ECS Optimized AMI (for EC2 launch type if needed)
data "aws_ami" "ecs_optimized" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-ecs-hvm-*-x86_64-ebs"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
} 