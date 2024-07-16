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

# Grant backend access to read/write/delete objects in the media bucket and SQS queues
data "aws_iam_policy_document" "media_bucket_access" {
  # List objects in media bucket
  statement {
    sid       = "1"
    effect    = "Allow"
    actions   = ["s3:ListObjects"]
    resources = [data.aws_s3_bucket.media.arn]
  }

  # Read, write, and delete objects in media bucket
  statement {
    sid       = "2"
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${data.aws_s3_bucket.media.arn}/*"]
  }

  # Send messages to SQS queues
  statement {
    sid       = "3"
    effect    = "Allow"
    actions   = ["sqs:SendMessage"]
    resources = [aws_sqs_queue.email.arn]
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

resource "aws_iam_role" "emails_lambda_fn" {
  name               = "bt_emails_${var.env}_${data.aws_region.current.name}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

data "aws_iam_policy_document" "emails_sqs_access" {
  statement {
    sid    = "0"
    effect = "Allow"
    actions = [
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:ReceiveMessage",
    ]
    resources = [aws_sqs_queue.email.arn]
  }
}

resource "aws_iam_policy" "emails_sqs_access" {
  name   = "bt_emails_sqs_access_${var.env}_${data.aws_region.current.name}"
  policy = data.aws_iam_policy_document.emails_sqs_access.json
}

resource "aws_iam_role_policy_attachment" "email_service_queue_access" {
  role       = aws_iam_role.emails_lambda_fn.name
  policy_arn = aws_iam_policy.emails_sqs_access.arn
}
