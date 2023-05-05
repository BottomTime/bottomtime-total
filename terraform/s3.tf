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
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ReadAccess"
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = ["${aws_s3_bucket.web.arn}/*"]
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.web.iam_arn
        }
      },
    ]
  })
}

resource "aws_s3_bucket_policy" "docs" {
  bucket = aws_s3_bucket.docs.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ReadAccess",
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = ["${aws_s3_bucket.docs.arn}/*"]
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.docs.iam_arn
        }
      }
    ]
  })
}
