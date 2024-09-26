locals {
  authentication_domain = "auth"
  cognito_domain        = "cognito"
}

data "aws_route53_zone" "main" {
  name = "${var.root_domain}."
}

resource "aws_route53_record" "authentication" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.authentication_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.authenticator.domain_name
    zone_id                = aws_cloudfront_distribution.authenticator.hosted_zone_id
    evaluate_target_health = false
  }
}
