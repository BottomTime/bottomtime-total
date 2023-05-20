resource "aws_s3_bucket" "web" {
  bucket        = "${var.service_name_short}-${data.aws_region.current.name}-${var.env}-web-distro"
  force_destroy = true

  tags = {
    Name        = "${var.service_name} Web Distro Bucket"
    Environment = var.env
  }
}

resource "aws_s3_bucket" "docs" {
  bucket        = "${var.service_name_short}-${data.aws_region.current.name}-${var.env}-docs-distro"
  force_destroy = true

  tags = {
    Name        = "${var.service_name} Docs Distro Bucket"
    Environment = var.env
  }
}

resource "aws_s3_bucket_policy" "web" {
  bucket = aws_s3_bucket.web.id
  policy = jsonencode({
    Id      = "PolicyForCloudFrontPrivateContent"
    Version = "2008-10-17"
    Statement = [
      {
        Sid = "AllowCloudFrontServicePrincipal"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.web.arn
          }
        }
        Effect   = "Allow"
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.web.arn}/*"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "docs" {
  bucket = aws_s3_bucket.docs.id
  policy = jsonencode({
    Id      = "PolicyForCloudFrontPrivateContent"
    Version = "2008-10-17"
    Statement = [
      {
        Sid = "AllowCloudFrontServicePrincipal"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.docs.arn
          }
        }
        Effect   = "Allow"
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.docs.arn}/*"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
      }
    ]
  })
}
