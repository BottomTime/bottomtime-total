resource "aws_cloudwatch_log_group" "service_logs" {
  name              = "/bt/service/${var.env}/${data.aws_region.current.name}"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_log_group" "ssr_logs" {
  name              = "/bt/ssr/${var.env}/${data.aws_region.current.name}"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_log_group" "emails_logs" {
  name              = "/bt/emails/${var.env}/${data.aws_region.current.name}"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_log_group" "keepalive_logs" {
  name              = "/bt/keepalive/${var.env}/${data.aws_region.current.name}"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_log_group" "auth_logs" {
  name              = "/bt/edge-auth/${var.env}/${data.aws_region.current.name}"
  retention_in_days = var.log_retention_days
}
