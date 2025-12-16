resource "aws_security_group" "ecs" {
  name   = "tmca-analytics-ecs-sg"
  description = "TMCA Wrike Analytics"
  tags = {
    Name = "tmca-analytics"
  }
  vpc_id = var.vpc_id

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    security_groups = [var.alb_security_group_id] # allow only alb access
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

output "ecs_sg" {
  value = aws_security_group.ecs.id
}