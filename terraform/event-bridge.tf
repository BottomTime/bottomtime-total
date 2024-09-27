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
    mode                      = "FLEXIBLE"
    maximum_window_in_minutes = 5
  }

  schedule_expression_timezone = "UTC"
  schedule_expression          = "rate(${var.keepalive_interval} minutes)"

  target {
    arn      = aws_lambda_function.keepalive.arn
    role_arn = aws_iam_role.scheduler_role.arn
  }
}
