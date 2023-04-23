output "service_endpoint" {
  value = aws_route53_record.service.fqdn
}

output "site_endpoint" {
  value = aws_route53_record.site.fqdn
}

output "docs_endpoint" {
  value = aws_route53_record.docs.fqdn
}
