resource "aws_lb_target_group" "wrike" {
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

resource "aws_lb_listener_rule" "analytics" {
  listener_arn = var.alb_listener_arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.wrike.arn
  }

  condition {
    host_header {
      values = ["wrike.${trimsuffix(data.aws_route53_zone.main.name, ".")}"]
    }
  }
}

resource "aws_lb_listener_rule" "www_wrike_redirect" {
  listener_arn = var.alb_listener_arn
  priority     = 90

  action {
    type = "redirect"

    redirect {
      protocol    = "HTTPS"
      port        = "443"
      host        = "wrike.${trimsuffix(data.aws_route53_zone.main.name, ".")}"
      path        = "/#{path}"
      query       = "#{query}"
      status_code = "HTTP_301"
    }
  }

  condition {
    host_header {
      values = ["www.wrike.${trimsuffix(data.aws_route53_zone.main.name, ".")}"]
    }
  }
}
