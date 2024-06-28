variable "api_domain" {
  description = "The partial domain name at which the backend APIs will respond to requests. (e.g. api-staging)"
  type        = string
}
variable "cookie_name" {
  description = "Name of the session cookie as it will appear in the browser."
  type        = string
  nullable    = true
}

variable "env" {
  description = "The environment in which the resources are being created. E.g. dev, stage, prod, etc."
  type        = string
}

variable "log_level" {
  description = "The level of verbosity at which events will be written to the log stream."
  type        = string
  default     = "info"
  validation {
    condition     = can(regex("^(trace|debug|info|warn|error|fatal)$", var.log_level))
    error_message = "The log_level must be one of trace, debug, info, warn, error, or fatal."
  }
}

variable "password_salt_rounds" {
  description = "Number of rounds to use when computing a salted password hash. More will be more secure but slower. Default is 15."
  type        = number
  default     = 15
}

variable "root_domain" {
  description = "The root domain for the service. Other domains will be under this domain."
  type        = string
  default     = "bottomti.me"
}

variable "secret_name" {
  description = "The name of the AWS Secrets Manager secret that contains the sensitive configuration values."
  type        = string
}

data "aws_region" "current" {}

locals {
  cookie_name = var.cookie_name == null ? "bottomtime.${var.env}" : var.cookie_name
}
