# tf_state config
terraform {
  backend "s3" {
    bucket       = "tmca-analytics-state"
    key          = "tmca-analytics/terraform.tfstate"
    region       = "eu-north-1"
    use_lockfile = true
    encrypt      = true
  }

  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

provider "aws" {
  region = local.region
}

# reuse network config
data "aws_ssm_parameter" "tmca_vpc_id" {
  name            = "/wm/vpc_id"
  with_decryption = true
}

# for new ECS cluster
data "aws_ssm_parameter" "private_subnets" {
  name            = "/wm/network/private_subnets"
  with_decryption = false
}

# for new RDS instance
data "aws_ssm_parameter" "database_subnets" {
  name            = "/wm/network/database_subnets"
  with_decryption = false
}

data "aws_ssm_parameter" "database_subnet_group_name" {
  name            = "/wm/network/database_subnet_group_name"
  with_decryption = false
}

# reuse alb
data "aws_ssm_parameter" "alb_security_group_id" {
  name            = "/wm/tmca_alb_security_group_id"
  with_decryption = false
}

data "aws_ssm_parameter" "alb_listener_arn" {
  name            = "/wm/tmca_alb_https_listener_arn"
  with_decryption = false
}

data "aws_ssm_parameter" "alb_dns_name" {
  name            = "/wm/tmca_alb_dns_name"
  with_decryption = false
}

data "aws_ssm_parameter" "alb_zone_id" {
  name            = "/wm/tmca_alb_zone_id"
  with_decryption = false
}

# RDS config
module "rds_postgres" {
  source                = "../modules/rds"
  rds_user              = local.rds_user
  database_subnets      = split(",", data.aws_ssm_parameter.database_subnets.value)
  security_group        = aws_security_group.rds_sg.id
  subnet_group_name     = data.aws_ssm_parameter.database_subnet_group_name.value
  rds_allocated_storage = local.rds_allocated_storage
  rds_db_name           = local.rds_db_name
}

# new ECS
module "tmca-analytics-engine" {
  source     = "../modules/ecs"
  aws_region = local.region
  name       = "tmca_analitics"

  # network
  subdomain       = local.subdomain
  hosted_zone     = local.hosted_zone
  vpc_id          = data.aws_ssm_parameter.tmca_vpc_id.value
  private_subnets = split(",", data.aws_ssm_parameter.private_subnets.value)

  # ecs
  ecs_cluster_name        = "tmca-analytics-ecs-cluster"
  cpu                     = 512
  memory                  = 1024
  asg_min_capacity        = 1
  asg_max_capacity        = 2
  asg_cpu_target_value    = 70
  asg_memory_target_value = 70

  # db
  db_secret_arn = module.rds_postgres.rds_user_secret_arn

  # alb
  alb_security_group_id = data.aws_ssm_parameter.alb_security_group_id.value
  alb_listener_arn      = data.aws_ssm_parameter.alb_listener_arn.value
  alb_dns_name          = data.aws_ssm_parameter.alb_dns_name.value
  alb_zone_id           = data.aws_ssm_parameter.alb_zone_id.value
}
