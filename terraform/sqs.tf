resource "aws_sqs_queue" "email_deadletter" {
  name                      = "bt-email-deadletter-${var.env}"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Environment = var.env
    Purpose     = "Email Transmission Deadletter"
    Region      = data.aws_region.current.name
  }
}

resource "aws_sqs_queue" "email" {
  name = "bt-email-${var.env}"

  redrive_policy = jsonencode({
    deadLetterTargetArn = "${aws_sqs_queue.email_deadletter.arn}",
    maxReceiveCount     = 3
  })

  tags = {
    Environment = var.env
    Purpose     = "Email Transmission"
    Region      = data.aws_region.current.name
  }
}

resource "aws_sqs_queue_redrive_allow_policy" "email" {
  queue_url = aws_sqs_queue.email_deadletter.id
  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue"
    sourceQueueArns   = [aws_sqs_queue.email.arn]
  })
}
