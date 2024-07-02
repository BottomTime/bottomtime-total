locals {
  lambda_exec_policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    sid     = "1"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# Grant backend access to read/write/delete objects in the media bucket
data "aws_iam_policy_document" "media_bucket_access" {
  statement {
    sid       = "1"
    effect    = "Allow"
    actions   = ["s3:ListObjects"]
    resources = [data.aws_s3_bucket.media.arn]
  }

  statement {
    sid       = "2"
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${data.aws_s3_bucket.media.arn}/*"]
  }
}

resource "aws_iam_policy" "media_bucket_access" {
  name   = "bt_media_bucket_access_${var.env}_${data.aws_region.current.name}"
  policy = data.aws_iam_policy_document.media_bucket_access.json
}

resource "aws_iam_role" "service_lambda_fn" {
  name               = "bt_service_${var.env}_${data.aws_region.current.name}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "service_lambda_logging" {
  role       = aws_iam_role.service_lambda_fn.name
  policy_arn = local.lambda_exec_policy_arn
}

resource "aws_iam_role_policy_attachment" "service_media_bucket_access" {
  role       = aws_iam_role.service_lambda_fn.name
  policy_arn = aws_iam_policy.media_bucket_access.arn
}

resource "aws_iam_role" "ssr_lambda_fn" {
  name               = "bt_ssr_${data.aws_region.current.name}_${var.env}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "ssr_lambda_logging" {
  role       = aws_iam_role.ssr_lambda_fn.name
  policy_arn = local.lambda_exec_policy_arn
}
