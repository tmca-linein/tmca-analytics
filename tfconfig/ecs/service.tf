resource "aws_cloudwatch_log_group" "main" {
  name              = local.log_group_name
  retention_in_days = 7
}

resource "aws_ecs_task_definition" "main" {
  family                   = local.service_name # unique name for task definition
  cpu                      = var.cpu
  memory                   = var.memory
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  execution_role_arn       = aws_iam_role.ecs_task_exec_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = local.container_name
      image     = local.tmca_analytics_image
      essential = true
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-region"        = var.aws_region
          "awslogs-group"         = local.log_group_name
          "awslogs-stream-prefix" = local.container_name
        }
      }
      environment = [
          {
            name = "NEXTAUTH_URL",
            value = local.nextauth_url
          },
          {
            name = "NEXTAUTH_SESSION_TOKEN",
            value = "next-auth.session-token"
          },
          {
            name = "NEXT_PUBLIC_API",
            value = "https://www.wrike.com/api/v4"
          }
      ]
      secrets = [
        {
            name = "DB_USER",
            valueFrom = "${var.db_secret_arn}:username::"
        },
        {
            name = "DB_PASSWORD",
            valueFrom = "${var.db_secret_arn}:password::"
        },
        {
            name = "DB_HOST",
            valueFrom = local.rds_host
        },
        {
            name = "DB_NAME",
            valueFrom = local.rds_name
        },
        {
          name      = "WRIKE_WEBHOOK_SECRET",
          valueFrom = local.wrike_x_hook_secret_arn
        },
        {
            name = "WRIKE_CLIENT_ID",
            valueFrom = local.wrike_client_id_arn
        },
        {
            name = "WRIKE_CLIENT_SECRET",
            valueFrom = local.wrike_client_secret_arn
        },
        {
            name = "NEXTAUTH_SECRET",
            valueFrom = local.nextauth_secret_arn
        }
      ]

      portMappings = [
        {
          protocol      = "tcp"
          containerPort = 3000
        }
      ]
    }
  ])
}

resource "aws_ecs_service" "main" {
  name            = local.service_name
  cluster         = aws_ecs_cluster.tmca_analytics_platform.arn
  task_definition = aws_ecs_task_definition.main.arn
  depends_on      = [aws_lb_target_group.main]
  launch_type     = "FARGATE"

  desired_count                      = 1
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  health_check_grace_period_seconds  = 60
  enable_ecs_managed_tags            = false
  enable_execute_command             = false

  network_configuration {
    subnets          = var.private_subnets
    assign_public_ip = false
    security_groups  = [aws_security_group.ecs.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.wrike.arn
    container_name   = local.container_name
    container_port   = 3000
  }

  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }
}
