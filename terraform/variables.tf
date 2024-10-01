variable "admin_email" {
  description = "Email address of the site administrator."
  type        = string
}

variable "allow_public_access" {
  description = "Indicates whether the environment should be publicly accessible using the endpoint URLs. If this is false, then a signed cookie will be required for all requests."
  type        = bool
  default     = false
}

variable "api_domain" {
  description = "The partial domain name at which the backend APIs will respond to requests. (e.g. api-staging)"
  type        = string
}

variable "auth_cookie_name" {
  description = "The name of the cookie used to store the edge authorization JWT."
  type        = string
  default     = "bt.auth"
}

variable "configcat_sdk_key" {
  description = "ConfigCat SDK key for the environment. Used to access feature flags."
  type        = string
}

variable "cookie_name" {
  description = "Name of the session cookie as it will appear in the browser."
  type        = string
  default     = "bottomtime"
}

variable "docs_domain" {
  description = "The partial domain name at which the backend API documentation can be accessed."
  type        = string
}

variable "edgeauth_enabled" {
  description = "Indicates whether this is a protected environment and should require an edge authorization JWT for all requests."
  type        = bool
  default     = false
}

variable "edgeauth_config_secret" {
  description = "Name of the AWS Secret Manager secret that contains the configuration for the edge authentication service."
  type        = string
  default     = "bt-edgeauth-config"
}

variable "edgeauth_cookie_name" {
  description = "Name of the session cookie for the edge authentication service."
  type        = string
  default     = "bottomtime.auth"
}

variable "enable_keep_alive" {
  description = "Boolean value indicating whether the keep alive Lambda function should be run periodically to prevent the front- and back-end Lambdas from cold starts."
  type        = bool
  default     = true
}

variable "enable_places_api" {
  description = "Indicates whether calls should be made to Google Places API. Default is false because this can be expensive and should only be enabled when needed."
  type        = bool
  default     = false
}

variable "env" {
  description = "The environment in which the resources are being created. E.g. dev, stage, prod, etc."
  type        = string
}

variable "keepalive_interval" {
  description = "Interval (in minutes) in which the keepalive function should be called."
  type        = number
  default     = 30
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

variable "log_retention_days" {
  description = "The number of days to retain log events in the Cloudwatch log groups."
  type        = number
  default     = 7
}

variable "media_bucket" {
  description = "Name of the AWS S3 bucket where user-generated media (video, pictures, etc.) will be stored. This will be shared between regions and needs to be created manually, outside of Terraform."
  type        = string
}

variable "secure_cookie" {
  description = "Indicates whether the session cookie should be secured. If false, the cookie will work over HTTP or HTTPS. If true, the cookie will only work over HTTPS."
  type        = bool
  default     = true
}

variable "password_salt_rounds" {
  description = "Number of rounds to use when computing a salted password hash. More will be more secure but slower. Default is 15."
  type        = number
  default     = 12
}

variable "root_domain" {
  description = "The root domain for the service. Other domains will be under this domain. (E.g. bottomtime.com)"
  type        = string
  default     = "bottomti.me"
}

variable "secret_name" {
  description = "The name of the AWS Secrets Manager secret that contains the sensitive configuration values."
  type        = string
}

variable "web_domain" {
  description = "Partial domain name at which the front-end web application will respond to requests. (E.g. 'staging')"
  type        = string
}

data "aws_region" "current" {}

locals {
  cookie_name = var.cookie_name == null ? "bottomtime.${var.env}" : var.cookie_name
}
