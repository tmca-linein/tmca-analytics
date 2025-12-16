module "rds_postgres" {
  source                      = "terraform-aws-modules/rds/aws"
  version                     = "6.1.1"
  identifier                  = "tmcaa-postgres"
  engine                      = "postgres"
  engine_version              = "14.15"
  instance_class              = "db.t4g.medium"
  storage_encrypted           = true
  allocated_storage           = var.rds_allocated_storage
  major_engine_version        = "14"
  family                      = "postgres14"
  username                    = var.rds_user
  manage_master_user_password = true
  db_name                     = var.rds_db_name
  port                        = 5432
  multi_az                    = false
  vpc_security_group_ids      = [var.security_group]
  subnet_ids                  = var.database_subnets
  db_subnet_group_name        = var.subnet_group_name
  monitoring_role_arn         = aws_iam_role.rds_monitoring_role.arn
  monitoring_interval         = 60
  apply_immediately           = true
  skip_final_snapshot         = true
  maintenance_window          = "Sun:05:00-Sun:06:00"
  backup_retention_period     = 7
  backup_window               = "19:00-20:00"
}

output "rds_user_secret_arn" {
  value = module.rds_postgres.db_instance_master_user_secret_arn
}

resource "aws_ssm_parameter" "rds_host" {
  name        = "/tmcaa/rds/host"
  description = "RDS host"
  type        = "SecureString"
  value       = module.rds_postgres.db_instance_address
}

resource "aws_ssm_parameter" "rds_database_name" {
  name        = "/tmcaa/rds/name"
  description = "RDS database name"
  type        = "SecureString"
  value       = module.rds_postgres.db_instance_name
}
