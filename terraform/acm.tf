data "aws_acm_certificate" "alb" {
  domain   = var.certificate_domain
  statuses = ["ISSUED"]
}
