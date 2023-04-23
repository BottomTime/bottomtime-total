resource "aws_route53_record" "service" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.service_domain
  type    = "A"

  alias {
    name                   = aws_alb.alb.dns_name
    zone_id                = aws_alb.alb.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "site_top_level" {
  count = var.env == "production" ? 1 : 0
  zone_id = data.aws_route53_zone.main.zone_id
  name    = ""
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.web.domain_name
    zone_id                = aws_cloudfront_distribution.web.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "site" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.site_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.web.domain_name
    zone_id                = aws_cloudfront_distribution.web.hosted_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "docs" {
  zone_id = data.aws_route53_zone.main.zone_id
  name = var.docs_domain
  type = "A"

  alias {
    name = aws_cloudfront_distribution.docs.domain_name
    zone_id = aws_cloudfront_distribution.docs.hosted_zone_id
    evaluate_target_health = true
  }
}
