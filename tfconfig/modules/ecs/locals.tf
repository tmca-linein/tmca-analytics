data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

locals {
  account = data.aws_caller_identity.current.account_id
  region  = var.aws_region

  tmca_analytics_release_version = "0.0.28"
  tmca_analytics_image           = "${local.account}.dkr.ecr.${local.region}.amazonaws.com/tmca_analytics:${local.tmca_analytics_release_version}"

  rds_host = "arn:aws:ssm:${local.region}:${local.account}:parameter/tmcaa/rds/host"
  rds_name = "arn:aws:ssm:${local.region}:${local.account}:parameter/tmcaa/rds/name"

  wrike_x_hook_secret_arn = "arn:aws:ssm:${local.region}:${local.account}:parameter/tmcaa/x-hook-secret"
  wrike_client_id_arn     = "arn:aws:ssm:${local.region}:${local.account}:parameter/tmcaa/wrike-client-id"
  wrike_client_secret_arn = "arn:aws:ssm:${local.region}:${local.account}:parameter/tmcaa/wrike-client-secret"
  nextauth_secret_arn     = "arn:aws:ssm:${local.region}:${local.account}:parameter/tmcaa/nextauth-secret"
  nextauth_url            = "https://${var.subdomain}.${var.hosted_zone}"
  field_next_attention_needed = "arn:aws:ssm:${local.region}:${local.account}:parameter/tmcaa/next-attention-needed"
  field_date_that_must_be_finished = "arn:aws:ssm:${local.region}:${local.account}:parameter/tmcaa/date-that-must-be-finished"

  log_group_name = "/ecs/${var.name}"
  service_name   = "${var.name}-service"
  container_name = "${var.name}-container"
}
