resource "aws_s3_bucket" "media" {
  bucket        = "bottomtime-media-${var.env}"
  force_destroy = true
  tags = {
    Environment = var.env
  }
}

resource "aws_s3_bucket_ownership_controls" "media" {
  bucket = aws_s3_bucket.media.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "media" {
  depends_on = [aws_s3_bucket_ownership_controls.media]
  bucket     = aws_s3_bucket.media.id
  acl        = "private"
}

resource "aws_s3_bucket" "cf" {
  bucket        = "bottomtime-web-${var.env}-${data.aws_region.current.name}"
  force_destroy = true

  tags = {
    Environment = var.env
    Region      = data.aws_region.current.name
  }
}

resource "aws_s3_bucket_ownership_controls" "cf" {
  bucket = aws_s3_bucket.cf.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "cf" {
  depends_on = [aws_s3_bucket_ownership_controls.cf]
  bucket     = aws_s3_bucket.cf.id
  acl        = "private"
}
