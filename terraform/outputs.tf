output "media_bucket" {
  value       = aws_s3_bucket.media.id
  description = "Name of the S3 bucket where media files (pictures, videos, etc.) are stored."
}

output "service_endpoint" {
  value       = aws_apigatewayv2_api.service.api_endpoint
  description = "The URL of the API Gateway service for the backend."
}
