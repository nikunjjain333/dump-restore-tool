output "db_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_identifier" {
  description = "RDS identifier"
  value       = aws_db_instance.main.identifier
}

output "db_port" {
  description = "RDS port"
  value       = aws_db_instance.main.port
} 