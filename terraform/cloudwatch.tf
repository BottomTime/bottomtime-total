resource "aws_cloudwatch_log_group" "service_logs" {
  name              = "/bt/service/${var.env}/${data.aws_region.current.name}"
  retention_in_days = 7
}
