output "web_cf_bucket" {
  value       = aws_s3_bucket.web.id
  description = "Name of the S3 bucket that will hold the front-end assets."
}

output "web_cf_distribution" {
  value       = aws_cloudfront_distribution.web.id
  description = "ID of the CloudFront distribution for the front-end."
}

output "service_endpoint" {
  value       = "https://${aws_route53_record.api.fqdn}/"
  description = "The URL of the API Gateway service for the backend."
}

output "web_endpoint" {
  value       = "https://${aws_route53_record.web.fqdn}/"
  description = "The URL at which the front-end will respond to requests."
}
