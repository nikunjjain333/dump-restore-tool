# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = var.security_group_ids
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false

  tags = {
    Name        = "${var.environment}-alb"
    Environment = var.environment
  }
}

# Listener for Backend (Port 80 -> 8000)
resource "aws_lb_listener" "backend" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = var.backend_target_group_arn
  }

  tags = {
    Name        = "${var.environment}-backend-listener"
    Environment = var.environment
  }
}

# Listener Rule for Frontend (Path-based routing)
resource "aws_lb_listener_rule" "frontend" {
  listener_arn = aws_lb_listener.backend.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = var.frontend_target_group_arn
  }

  condition {
    path_pattern {
      values = ["/", "/static/*", "/assets/*", "/*.js", "/*.css", "/*.ico", "/*.png", "/*.jpg", "/*.svg"]
    }
  }

  tags = {
    Name        = "${var.environment}-frontend-rule"
    Environment = var.environment
  }
}

# Listener Rule for API (Path-based routing)
resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.backend.arn
  priority     = 200

  action {
    type             = "forward"
    target_group_arn = var.backend_target_group_arn
  }

  condition {
    path_pattern {
      values = ["/api/*", "/health", "/docs", "/openapi.json"]
    }
  }

  tags = {
    Name        = "${var.environment}-api-rule"
    Environment = var.environment
  }
} 