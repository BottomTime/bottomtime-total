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
      identifiers = ["lambda.amazonaws.com", "edgelambda.amazonaws.com"]
    }
  }
}

# Grant backend access to read/write/delete objects in the media bucket
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
}

# Grant access to send messages to the email SQS queue
data "aws_iam_policy_document" "sqs_queue_access" {
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

resource "aws_iam_policy" "sqs_queue_access" {
  name   = "bt_sqs_queue_access_${var.env}_${data.aws_region.current.name}"
  policy = data.aws_iam_policy_document.sqs_queue_access.json
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

resource "aws_iam_role_policy_attachment" "service_sqs_queue_access" {
  role       = aws_iam_role.service_lambda_fn.name
  policy_arn = aws_iam_policy.sqs_queue_access.arn
}

## FRONT-END SSR
resource "aws_iam_role" "ssr_lambda_fn" {
  name               = "bt_ssr_${data.aws_region.current.name}_${var.env}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "ssr_lambda_logging" {
  role       = aws_iam_role.ssr_lambda_fn.name
  policy_arn = local.lambda_exec_policy_arn
}

### EMAIL SERVICE
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

### KEEPALIVE FUNCTION
resource "aws_iam_role" "keepalive_lambda_fn" {
  name               = "bt_keepalive_${var.env}_${data.aws_region.current.name}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "keepalive_lambda_logging" {
  role       = aws_iam_role.keepalive_lambda_fn.name
  policy_arn = local.lambda_exec_policy_arn
}

### EDGE AUTHENTICATION SERVICE
resource "aws_iam_role" "edgeauth_lambda_fn" {
  name               = "bt_edgeauth_${var.env}_${data.aws_region.current.name}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "edgeauth_lambda_logging" {
  role       = aws_iam_role.edgeauth_lambda_fn.name
  policy_arn = local.lambda_exec_policy_arn
}

### Scheduler
data "aws_iam_policy_document" "scheduler_assume_role" {
  statement {
    sid     = "1"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "scheduler_role" {
  name               = "bt_scheduler_${var.env}_${data.aws_region.current.name}"
  assume_role_policy = data.aws_iam_policy_document.scheduler_assume_role.json
}
