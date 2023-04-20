output "service_endpoint" {
  value = aws_route53_record.service.fqdn
}
