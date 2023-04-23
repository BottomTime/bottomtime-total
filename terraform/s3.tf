resource "aws_s3_bucket" "web" {
  bucket = "${var.service_name_short}-${data.aws_region.current.name}-${var.env}-web-distro"
  force_destroy = true

  tags = {
    Name        = "${var.service_name} Web Distro Bucket"
    Environment = var.env
  }
}

resource "aws_s3_bucket_acl" "web" {
  bucket = aws_s3_bucket.web.id
  acl    = "private"
}

resource "aws_s3_bucket" "docs" {
  bucket = "${var.service_name_short}-${data.aws_region.current.name}-${var.env}-docs-distro"
  force_destroy = true

  tags = {
    Name        = "${var.service_name} Docs Distro Bucket"
    Environment = var.env
  }
}

resource "aws_s3_bucket_acl" "docs" {
  bucket = aws_s3_bucket.docs.id
  acl    = "private"
}
