data "aws_route53_zone" "main" {
  name = var.hosted_zone
}

# module "acm" {
#   source = "terraform-aws-modules/acm/aws"

#   domain_name = data.aws_route53_zone.main.name
#   zone_id     = data.aws_route53_zone.main.zone_id

#   validation_method = "DNS"

#   subject_alternative_names = [
#     "wrike.${data.aws_route53_zone.main.name}",
#   ]

#   wait_for_validation = true

#   depends_on = [
#     data.aws_route53_zone.main
#   ]
# }

resource "aws_route53_record" "wrike_alias_a" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "wrike.${data.aws_route53_zone.main.name}"
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}
