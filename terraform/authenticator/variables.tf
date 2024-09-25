data "aws_region" "current" {}

variable "cookie_name" {
  description = "The name of the cookie used to store the JWT."
  type        = string
  default     = "bt.auth"
}

variable "log_level" {
  description = "The log level for the Lambda functions."
  type        = string
  default     = "info"
}

variable "log_retention_days" {
  description = "The number of days to retain log events in the log group."
  type        = number
  default     = 7
}

variable "root_domain" {
  description = "The root domain for the application. (Used to locate the Hosted Zone in Route 53)"
  type        = string
  default     = "bottomti.me"
}
