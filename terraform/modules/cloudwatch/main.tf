# CloudWatch Dashboard - REMOVED to stay completely free
# (Only 3 dashboards free, then $3/month per dashboard)
# Use AWS Console CloudWatch for monitoring instead

# CloudWatch Alarm for High CPU Usage
resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  alarm_name          = "${var.environment}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS CPU utilization"
  alarm_actions       = []

  dimensions = {
    ClusterName = var.ecs_cluster_name
  }

  tags = {
    Name        = "${var.environment}-ecs-cpu-alarm"
    Environment = var.environment
  }
}

# CloudWatch Memory Alarm - REMOVED to save alarm quota
# (Free tier: 10 alarms total, keep only essential ones)

# CloudWatch Alarm for RDS CPU
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.environment}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = []

  dimensions = {
    DBInstanceIdentifier = var.rds_identifier
  }

  tags = {
    Name        = "${var.environment}-rds-cpu-alarm"
    Environment = var.environment
  }
}

# Data source for current region
data "aws_region" "current" {} 