output "cf_bucket" {
  value       = aws_s3_bucket.assets.bucket
  description = "Name of the S3 bucket for static assets for the authenticator service."
}

output "cf_distribution" {
  value       = aws_cloudfront_distribution.authenticator.id
  description = "ID of the Cloudfront distribution for the authenticator service."
}
