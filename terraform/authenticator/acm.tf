data "aws_acm_certificate" "main" {
  domain      = var.root_domain
  most_recent = true
}
