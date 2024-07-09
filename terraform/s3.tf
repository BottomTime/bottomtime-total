data "aws_s3_bucket" "media" {
  bucket = var.media_bucket
}

resource "aws_s3_bucket_ownership_controls" "media" {
  bucket = data.aws_s3_bucket.media.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "media" {
  depends_on = [aws_s3_bucket_ownership_controls.media]
  bucket     = data.aws_s3_bucket.media.id
  acl        = "private"
}

resource "aws_s3_bucket" "web" {
  bucket        = "bottomtime-web-${var.env}-${data.aws_region.current.name}"
  force_destroy = true

  tags = {
    Environment = var.env
    Purpose     = "Web front-end distribution"
  }
}

resource "aws_s3_bucket_ownership_controls" "web" {
  bucket = aws_s3_bucket.web.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

data "aws_iam_policy_document" "s3_cf_web_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.web.arn}/*"]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.web.iam_arn]
    }
  }
}

resource "aws_s3_bucket_acl" "web" {
  depends_on = [aws_s3_bucket_ownership_controls.web]
  bucket     = aws_s3_bucket.web.id
  acl        = "private"
}

resource "aws_s3_bucket_policy" "web" {
  bucket = aws_s3_bucket.web.id
  policy = data.aws_iam_policy_document.s3_cf_web_policy.json
}
