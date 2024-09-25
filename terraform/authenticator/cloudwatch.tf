resource "aws_cloudwatch_log_group" "authenticator_logs" {
  name              = "/bt/edge-authenticator/${data.aws_region.current.name}"
  retention_in_days = var.log_retention_days
}
