output "media_bucket" {
  value       = aws_s3_bucket.media.id
  description = "Name of the S3 bucket where media files (pictures, videos, etc.) are stored."
}

output "service_endpoint" {
  value       = "https://${aws_route53_record.api.fqdn}/"
  description = "The URL of the API Gateway service for the backend."
}
