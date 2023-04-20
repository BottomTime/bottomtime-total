variable "admin_email" {
  type        = string
  description = "Email address for contacting the site admin. (This appears in a few spots on the site as well as email templates.)"
  default     = "admin@bottomti.me"
}

variable "availability_zone_count" {
  type        = number
  description = "Number of availability zones to deploy to for redundancy. (Default is 2.)"
  default     = 2
  validation {
    condition     = var.availability_zone_count > 0
    error_message = "Availability zone count must be at least 1."
  }
}

variable "certificate_domain" {
  type        = string
  description = "The domain for which the TLS certificate for the site was issued. (Certificate must be registered in AWS ACM.)"
  default     = "*.bottomti.me"
}

variable "env" {
  type        = string
  description = "The name of the environment that is being deployed. (This is to distinguish multiple environments running in the same AWS region.)"
  default     = "dev"
}

variable "hosted_zone" {
  type        = string
  description = "The domain name of the hosted zone at which the service will respond to requests."
  default     = "bottomti.me."
}

variable "image_tag" {
  type        = string
  description = "ECR image tag to request when deploying the Docker image. (Defaults to 'latest'.)"
  default     = "latest"
}

variable "log_level" {
  type        = string
  description = "The level of log detail that will be written to the event log. (Default is 'info'.)"
  default     = "info"
  validation {
    condition     = contains(["trace", "debug", "info", "warn", "error", "fatal"], var.log_level)
    error_message = "Log level must be one of 'trace', 'debug', 'info', 'warn', 'error', or 'fatal'."
  }
}

variable "secret_id" {
  type        = string
  description = "The ID of the AWS Secrets Manager secret where the application secret values are held."
}

variable "service_domain" {
  type        = string
  description = "The domain in the hosted zone at which the backend service should be available."
  default     = "api"
}

variable "service_name" {
  type        = string
  description = "Name of the service as it should appear in resource names and tags"
  default     = "Bottom Time"
}

variable "service_name_short" {
  type        = string
  description = "Shortened name of the service that eliminates whitespace and special characters - safe for use where 'service_name' cannot be used."
  default     = "bt"
}

variable "site_domain" {
  type        = string
  description = "The domain in the hosted zone at which the web frontend should be available."
  default     = "www"
}

variable "smtp_from" {
  type        = string
  description = "The email address to use in the 'reply to' field when sending emails."
  default     = "\"Bottom Time Admin\" <admin@bottomti.me>"
}

variable "smtp_host" {
  type        = string
  description = "The hostname of the SMTP server that will be used to send emails."
}

variable "smtp_port" {
  type        = number
  description = "The port number on which to connect to the SMTP host when sending emails."
  default     = 465
}

variable "smtp_reply_to" {
  type        = string
  description = "The email address to use in the 'reply to' field when sending emails."
  default     = "donotreply@bottomti.me"
}

variable "smtp_username" {
  type        = string
  description = "The username to use when logging into the SMTP server to send emails."
}

data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_secretsmanager_secret_version" "secrets" {
  secret_id = var.secret_id
}

data "aws_route53_zone" "main" {
  name = var.hosted_zone
}

locals {
  base_url       = "https://${var.site_domain}.${var.hosted_zone}/"
  container_port = 4800
  image_name     = "${var.service_name_short}/${var.env}/core"
}
