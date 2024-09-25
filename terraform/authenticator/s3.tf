resource "aws_s3_bucket" "assets" {
  bucket        = "bottomtime-authorizer"
  force_destroy = true

  tags = {
    Region  = data.aws_region.current.name
    Purpose = "Bucket for static assets for the authenticator service for development."
  }
}

resource "aws_s3_bucket_ownership_controls" "assets" {
  bucket = aws_s3_bucket.assets.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "assets" {
  depends_on = [aws_s3_bucket_ownership_controls.assets]
  bucket     = aws_s3_bucket.assets.id
  acl        = "private"
}

resource "aws_s3_bucket_policy" "web" {
  bucket = aws_s3_bucket.assets.id
  policy = data.aws_iam_policy_document.s3_cf_policy.json
}
