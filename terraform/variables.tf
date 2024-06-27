variable "env" {
  description = "The environment in which the resources are being created. E.g. dev, stage, prod, etc."
  type        = string
}

data "aws_region" "current" {}
