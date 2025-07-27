# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.environment}-db-subnet-group"
    Environment = var.environment
  }
}

# RDS Parameter Group
resource "aws_db_parameter_group" "main" {
  family = "postgres16"
  name   = "${var.environment}-db-parameter-group"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  tags = {
    Name        = "${var.environment}-db-parameter-group"
    Environment = var.environment
  }
}

# RDS Instance (Free Tier: db.t3.micro)
resource "aws_db_instance" "main" {
  identifier = "${var.environment}-db"

  # Free Tier Configuration (db.t3.micro = 750 hours/month free)
  instance_class = "db.t3.micro"
  engine         = "postgres"
  engine_version = "16.9"

  # Storage (20GB free with free tier)
  allocated_storage     = 20    # Free tier limit
  max_allocated_storage = 20    # Keep at free tier limit
  storage_type         = "gp2"  # General Purpose SSD (free tier)
  storage_encrypted    = true   # Free encryption

  # Database Configuration
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = "5432"

  # Network Configuration
  vpc_security_group_ids = var.security_group_ids
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name

  # Backup Configuration (Free: automated backups included)
  backup_retention_period = 7                    # Minimum for production
  backup_window          = "03:00-04:00"        # Low traffic time
  maintenance_window     = "sun:04:00-sun:05:00" # Low traffic time

  # Performance Insights - DISABLED (only free for 7 days, then charges)
  performance_insights_enabled          = false

  # Enhanced Monitoring - DISABLED (charges after free period)
  monitoring_interval = 0

  # Deletion Protection
  deletion_protection = false
  skip_final_snapshot = true

  tags = {
    Name        = "${var.environment}-db"
    Environment = var.environment
  }
}

# IAM Role for RDS Monitoring - REMOVED (not needed without enhanced monitoring) 