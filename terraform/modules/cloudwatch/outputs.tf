# Dashboard outputs removed - dashboard disabled to stay within free tier
# Use AWS Console CloudWatch for monitoring instead

output "ecs_cpu_alarm_name" {
  description = "ECS CPU alarm name"
  value       = aws_cloudwatch_metric_alarm.ecs_cpu.alarm_name
}

output "rds_cpu_alarm_name" {
  description = "RDS CPU alarm name"
  value       = aws_cloudwatch_metric_alarm.rds_cpu.alarm_name
} 