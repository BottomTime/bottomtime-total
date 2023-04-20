resource "aws_cloudwatch_log_group" "core" {
  name              = "${var.service_name_short}-${data.aws_region.current.name}-${var.env}-logs"
  retention_in_days = 90
}
