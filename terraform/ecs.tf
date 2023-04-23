locals {
  container_env = [
    {
      name  = "BT_ADMIN_EMAIL"
      value = var.admin_email
    },
    {
      name  = "BT_BASE_URL"
      value = local.base_url
    },
    {
      name  = "BT_LOG_LEVEL"
      value = var.log_level
    },
    {
      name  = "BT_SESSION_COOKIE_DOMAIN"
      value = var.hosted_zone
    },
    {
      name  = "BT_SESSION_COOKIE_NAME"
      value = local.session_cookie_name
    },
    {
      name  = "BT_SMTP_FROM"
      value = var.smtp_from
    },
    {
      name  = "BT_SMTP_HOST"
      value = var.smtp_host
    },
    {
      name  = "BT_SMTP_PORT"
      value = tostring(var.smtp_port)
    },
    {
      name  = "BT_SMTP_REPLY_TO"
      value = var.smtp_reply_to
    },
    {
      name  = "BT_SMTP_USERNAME"
      value = var.smtp_username
    },
    {
      name  = "NODE_ENV"
      value = var.env
    }
  ]

  container_name = "${var.service_name_short}-${var.env}-core"

  container_secrets = [
    {
      name      = "BT_MONGO_URI"
      valueFrom = "${data.aws_secretsmanager_secret_version.secrets.arn}:mongo_uri::"
    },
    {
      name      = "BT_SESSION_SECRET"
      valueFrom = "${data.aws_secretsmanager_secret_version.secrets.arn}:session_secret::"
    },
    {
      name      = "BT_SMTP_PASSWORD"
      valueFrom = "${data.aws_secretsmanager_secret_version.secrets.arn}:smtp_password::"
    },
  ]
}

resource "aws_ecs_cluster" "core" {
  name = "${var.service_name_short}-${var.env}-cluster"
}

resource "aws_ecs_task_definition" "core" {
  family                   = "${var.service_name_short}-${var.env}-core"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512

  execution_role_arn = aws_iam_role.execution.arn
  task_role_arn      = aws_iam_role.task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode(
    [
      {
        name        = local.container_name
        image       = "${data.aws_ecr_repository.core.repository_url}:${var.image_tag}"
        essential   = true
        environment = local.container_env
        secrets     = local.container_secrets
        portMappings = [
          {
            protocol      = "tcp"
            containerPort = local.container_port
            hostPort      = local.container_port
          }
        ]
        logConfiguration = {
          logDriver = "awslogs"
          options = {
            "awslogs-group"         = aws_cloudwatch_log_group.core.name
            "awslogs-region"        = "us-east-1"
            "awslogs-stream-prefix" = var.image_tag
          }
        }
      }
    ]
  )
}

resource "aws_ecs_service" "main" {
  name                               = "${var.service_name_short}-${var.env}-service"
  cluster                            = aws_ecs_cluster.core.id
  task_definition                    = aws_ecs_task_definition.core.arn
  desired_count                      = 2
  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200
  launch_type                        = "FARGATE"
  scheduling_strategy                = "REPLICA"
  force_new_deployment               = true

  network_configuration {
    security_groups  = [aws_security_group.task.id]
    subnets          = aws_subnet.private.*.id
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_alb_target_group.main.arn
    container_name   = local.container_name
    container_port   = local.container_port
  }

  lifecycle {
    ignore_changes = [
      desired_count
    ]
  }

  depends_on = [
    aws_alb_target_group.main
  ]
}
