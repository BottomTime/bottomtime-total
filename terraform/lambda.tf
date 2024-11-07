### BACKEND API
resource "aws_lambda_function" "service" {
  function_name = "bottomtime-service-${var.env}"
  role          = aws_iam_role.service_lambda_fn.arn

  image_uri        = data.aws_ecr_image.service.image_uri
  source_code_hash = trimprefix(data.aws_ecr_image.service.image_digest, "sha256:")
  architectures    = ["arm64"]
  package_type     = "Image"

  description = "BottomTime Backend Service Lambda Function"
  timeout     = 30
  memory_size = 512

  logging_config {
    log_group  = aws_cloudwatch_log_group.service_logs.id
    log_format = "JSON"
  }

  tags = {
    Environment = var.env
    Region      = data.aws_region.current.name
  }

  environment {
    variables = {
      BT_EDGEAUTH_ENABLED        = "${var.edgeauth_enabled}"
      BT_EDGEAUTH_AUDIENCE       = local.web_fqdn
      BT_EDGEAUTH_COOKIE_NAME    = var.edgeauth_cookie_name
      BT_EDGEAUTH_SESSION_SECRET = local.auth_config.sessionSecret

      BT_AWS_MEDIA_BUCKET        = data.aws_s3_bucket.media.id
      BT_AWS_SQS_EMAIL_QUEUE_URL = aws_sqs_queue.email.id
      BT_BASE_URL                = "https://${local.web_fqdn}/"
      BT_LOG_LEVEL               = var.log_level
      BT_CONFIGCAT_SDK_KEY       = var.configcat_sdk_key
      BT_DISCORD_CLIENT_ID       = local.secrets.discordClientId
      BT_DISCORD_CLIENT_SECRET   = local.secrets.discordClientSecret
      BT_GITHUB_CLIENT_ID        = local.secrets.githubClientId
      BT_GITHUB_CLIENT_SECRET    = local.secrets.githubClientSecret
      BT_GOOGLE_CLIENT_ID        = local.secrets.googleClientId
      BT_GOOGLE_CLIENT_SECRET    = local.secrets.googleClientSecret
      BT_PASSWORD_SALT_ROUNDS    = "${var.password_salt_rounds}"
      BT_POSTGRES_REQUIRE_SSL    = "true"
      BT_POSTGRES_URI            = local.secrets.postgresUri
      BT_SESSION_COOKIE_DOMAIN   = local.web_fqdn
      BT_SESSION_COOKIE_NAME     = local.cookie_name
      BT_SESSION_SECRET          = local.secrets.sessionSecret
      BT_SESSION_SECURE_COOKIE   = "${var.secure_cookie}"
      BT_SMTP_REPLY_TO           = "donotreply@bottomti.me"
      BT_SMTP_FROM               = "\"Bottom Time Admin\" <admin@bottomti.me>"
      BT_SMTP_HOST               = local.secrets.smtpHost
      BT_SMTP_PASSWORD           = local.secrets.smtpPassword
      BT_SMTP_USERNAME           = local.secrets.smtpUsername
      BT_STRIPE_SDK_KEY          = local.secrets.stripeSdkKey
      BT_STRIPE_WEBHOOK_SECRET   = local.secrets.stripeWebhookSecret
      NODE_ENV                   = var.env
    }
  }

  depends_on = [aws_cloudwatch_log_group.service_logs, aws_iam_role_policy_attachment.service_lambda_logging]
}

resource "aws_lambda_permission" "allow_service_api_call" {
  statement_id  = "allow_apigateway_${var.env}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.service.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.service.execution_arn}/*/*"
}

### EMAIL SERVICE
data "archive_file" "email_service" {
  type        = "zip"
  output_path = "${path.module}/archive/email_service.zip"
  source_dir  = "${path.module}/../packages/emails/dist/"
}

resource "aws_lambda_function" "email_service" {
  function_name = "bottomtime-emails-${var.env}"
  role          = aws_iam_role.emails_lambda_fn.arn

  filename         = data.archive_file.email_service.output_path
  source_code_hash = data.archive_file.email_service.output_base64sha256

  description = "BottomTime Email Service Lambda Function"
  handler     = "service/sls.handler"
  runtime     = "nodejs20.x"
  timeout     = 30
  memory_size = 256

  logging_config {
    log_group  = aws_cloudwatch_log_group.emails_logs.id
    log_format = "JSON"
  }

  tags = {
    Environment = var.env
    Region      = data.aws_region.current.name
  }

  environment {
    variables = {
      BT_ADMIN_EMAIL   = var.admin_email
      BT_BASE_URL      = "https://${local.web_fqdn}/"
      BT_LOG_LEVEL     = var.log_level
      BT_SMTP_FROM     = "\"Bottom Time Admin\" <admin@bottomti.me>"
      BT_SMTP_HOST     = local.secrets.smtpHost
      BT_SMTP_PASSWORD = local.secrets.smtpPassword
      BT_SMTP_PORT     = "465"
      BT_SMTP_REPLY_TO = "donotreply@bottomti.me"
      BT_SMTP_USERNAME = local.secrets.smtpUsername
    }
  }

  depends_on = [aws_cloudwatch_log_group.service_logs, aws_iam_role_policy_attachment.service_lambda_logging]
}

resource "aws_lambda_event_source_mapping" "email_queue" {
  event_source_arn                   = aws_sqs_queue.email.arn
  enabled                            = true
  function_name                      = aws_lambda_function.email_service.arn
  batch_size                         = 15
  maximum_batching_window_in_seconds = 180
}

### KEEP-ALIVE FUNCTION
data "archive_file" "keepalive" {
  type        = "zip"
  output_path = "${path.module}/archive/keepalive.zip"
  source_dir  = "${path.module}/../packages/keepalive/dist/"
}

resource "aws_lambda_function" "keepalive" {
  function_name = "bottomtime-keepalive-${var.env}"
  role          = aws_iam_role.keepalive_lambda_fn.arn

  filename         = data.archive_file.keepalive.output_path
  source_code_hash = data.archive_file.keepalive.output_base64sha256

  description = "BottomTime Keep-Alive Lambda Function"
  handler     = "index.handler"
  runtime     = "nodejs20.x"
  timeout     = 60

  logging_config {
    log_group  = aws_cloudwatch_log_group.keepalive_logs.id
    log_format = "JSON"
  }

  tags = {
    Environment = var.env
    Region      = data.aws_region.current.name
  }

  environment {
    variables = {
      BT_PING_URL = "https://${local.web_fqdn}/"
    }
  }

  depends_on = [aws_cloudwatch_log_group.keepalive_logs, aws_iam_role_policy_attachment.keepalive_lambda_logging]
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowEventBridgeInvocation"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.keepalive.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_scheduler_schedule.keepalive.arn
}
