resource "aws_security_group" "rds_sg" {
  name        = "tmca-analytics-rds-sg"
  description = "Allow database access"
  vpc_id      = data.aws_ssm_parameter.tmca_vpc_id.value

  ingress {
    description = "Allow PostgreSQL from private subnets"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    security_groups = [
      module.tmca-analytics-engine.ecs_sg,
      "sg-0777984bc828a6ac5"
    ]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "tmca-analytics-rds-sg"
  }
}
