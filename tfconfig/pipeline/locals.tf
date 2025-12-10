locals {
  region = "eu-north-1"
  hosted_zone = "tmcarobotics.com"
  subdomain = "wrike"

  rds_allocated_storage = 10
  rds_db_name           = "tmca-analytics"
  rds_user = "tmca_analytics_prod"
}

