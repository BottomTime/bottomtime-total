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
