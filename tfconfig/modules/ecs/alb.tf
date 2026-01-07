
resource "aws_lb_target_group" "tmcaa" {
  name        = "tmca-analytics-tg"
  port        = 80
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = var.vpc_id

  health_check {
    path                = "/actuator/health" # change if your new app uses a different health endpoint
    matcher             = "200-499"
    interval            = 30
    timeout             = 10
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

# HTTPS :443 -> www host forward
resource "aws_lb_listener_rule" "https_www_forward" {
  listener_arn = var.alb_listener_arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.tmcaa.arn
  }

  condition {
    host_header {
      values = ["www.${trimsuffix(data.aws_route53_zone.main.name, ".")}"]
    }
  }
}

# HTTPS :443 -> apex redirect to www
resource "aws_lb_listener_rule" "https_apex_to_www" {
  listener_arn = var.alb_listener_arn
  priority     = 90

  action {
    type = "redirect"
    redirect {
      protocol    = "HTTPS"
      port        = "443"
      host        = "www.${trimsuffix(data.aws_route53_zone.main.name, ".")}"
      path        = "/#{path}"
      query       = "#{query}"
      status_code = "HTTP_301"
    }
  }

  condition {
    host_header {
      values = [trimsuffix(data.aws_route53_zone.main.name, ".")]
    }
  }
}

resource "aws_lb_listener_certificate" "tmcaa_cert" {
  listener_arn    = var.alb_listener_arn
  certificate_arn = module.acm.acm_certificate_arn
}
