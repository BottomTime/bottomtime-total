resource "aws_scheduler_schedule_group" "cron_group" {
  name = "bt-scheduled-${var.env}"
  tags = {
    Environment = var.env
    Region      = data.aws_region.current.name
  }
}

resource "aws_scheduler_schedule" "keepalive" {
  name       = "bt-keepalive-${var.env}"
  group_name = aws_scheduler_schedule_group.cron_group.name

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression_timezone = "UTC"
  schedule_expression          = "rate(x minutes)"

  target {
    arn      = aws_lambda_function.keepalive.arn
    role_arn = aws_iam_role.scheduler_role.arn
  }
}
