locals {
  lambda_exec_policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    sid     = "LambdaAssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "dynamodb_access" {
  statement {
    sid       = "DynamoDBGetItem"
    effect    = "Allow"
    actions   = ["dynamodb:GetItem"]
    resources = [aws_dynamodb_table.auth.arn]
  }
}

data "aws_iam_policy_document" "s3_cf_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.assets.arn}/*"]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.authenticator.iam_arn]
    }
  }
}

resource "aws_iam_role" "authenticator_lambda_fn" {
  name               = "bt_authenticator"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_policy" "dynamodb_access" {
  name   = "bt_dynamodb_access"
  policy = data.aws_iam_policy_document.dynamodb_access.json
}

resource "aws_iam_role_policy_attachment" "authenticator_lambda_logging" {
  role       = aws_iam_role.authenticator_lambda_fn.name
  policy_arn = local.lambda_exec_policy_arn
}

resource "aws_iam_role_policy_attachment" "authenticator_dynamodb_access" {
  role       = aws_iam_role.authenticator_lambda_fn.name
  policy_arn = aws_iam_policy.dynamodb_access.arn
}

