resource "aws_cloudwatch_log_group" "service_logs" {
  name              = "/bt/service/${var.env}/${data.aws_region.current.name}"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_log_group" "ssr_logs" {
  name              = "/bt/ssr/${var.env}/${data.aws_region.current.name}"
  retention_in_days = var.log_retention_days
}
