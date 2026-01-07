locals {
  region      = "eu-north-1"
  hosted_zone = "tmcabuddy.com"
  subdomain   = "www"

  rds_allocated_storage = 10
  rds_db_name           = "tmcaanalytics"
  rds_user              = "tmca_analytics_prod"
}

