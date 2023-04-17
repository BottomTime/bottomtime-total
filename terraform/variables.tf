data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

variable "availability_zone_count" {
  type = number
  description = "Number of availability zones to deploy to for redundancy. (Default is 2.)"
  default = 2
  validation {
    condition = var.availability_zone_count > 0
    error_message = "Availability zone count must be at least 1."
  }
}

variable "env" {
  type = string
  description = "The name of the environment that is being deployed. (This is to distinguish multiple environments running in the same AWS region.)"
  default = "Dev"
}

variable "service_name" {
  type = string
  description = "Name of the service as it should appear in resource names and tags"
  default = "Bottom Time"
}

variable "service_name_short" {
  type = string
  description = "Shortened name of the service that eliminates whitespace and special characters - safe for use where 'service_name' cannot be used."
  default = "bt"
}
