data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

locals {
  account = data.aws_caller_identity.current.account_id
  region  = var.aws_region
  
  tmca_analytics_release_version = "0.0.1"
  tmca_analytics_image = "${local.account}.dkr.ecr.${local.region}.amazonaws.com/tmca_analytics:${local.tmca_analytics_release_version}"

  rds_host     = "arn:aws:ssm:${local.region}:${local.account}:parameter/wrike/rds/host"
  rds_name     = "arn:aws:ssm:${local.region}:${local.account}:parameter/wrike/rds/name"

  wrike_x_hook_secret_arn = "arn:aws:ssm:${local.region}:${local.account}:parameter/wrike/x-hook-secret"
  wrike_client_id_arn = "arn:aws:ssm:${local.region}:${local.account}:parameter/wrike/wrike-client-id"
  wrike_client_secret_arn = "arn:aws:ssm:${local.region}:${local.account}:parameter/wrike/wrike-client-secret"
  nextauth_secret_arn = "arn:aws:ssm:${local.region}:${local.account}:parameter/wrike/nextauth-secret"
  nextauth_url = "https://${var.subdomain}.${var.hosted_zone}"

  log_group_name = "/ecs/${var.name}"
  service_name   = "${var.name}-service"
  container_name = "${var.name}-container"
}