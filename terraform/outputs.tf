output "media_bucket" {
  value       = aws_s3_bucket.media.id
  description = "Name of the S3 bucket where media files (pictures, videos, etc.) are stored."
}
