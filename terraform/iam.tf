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

data "aws_iam_policy_document" "apigateway_authorizer_assume_role" {
  statement {
    sid     = "AllowApiGatewayInvoke"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["apigateway.amazonaws.com", "lambda.amazonaws.com"]
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

### BACKEND SERVICE
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

### SCHEDULER
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

data "aws_iam_policy_document" "allow_eventbridge_lambda_invoke" {
  statement {
    sid       = "AllowEventBridgeLambdaInvoke"
    actions   = ["lambda:InvokeFunction"]
    effect    = "Allow"
    resources = [aws_lambda_function.keepalive.arn]
  }
}

resource "aws_iam_role" "scheduler_role" {
  name               = "bt_scheduler_${var.env}_${data.aws_region.current.name}"
  assume_role_policy = data.aws_iam_policy_document.scheduler_assume_role.json
}

resource "aws_iam_policy" "allow_eventbridge_lambda_invoke" {
  name   = "bt_allow_eventbridge_lambda_invoke_${var.env}_${data.aws_region.current.name}"
  policy = data.aws_iam_policy_document.allow_eventbridge_lambda_invoke.json
}

resource "aws_iam_role_policy_attachment" "allow_eventbridge_lambda_invoke" {
  role       = aws_iam_role.scheduler_role.name
  policy_arn = aws_iam_policy.allow_eventbridge_lambda_invoke.arn
}
