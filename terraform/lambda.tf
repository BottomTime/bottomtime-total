### BACKEND API
resource "aws_lambda_function" "service" {
  function_name = "bottomtime-service-${var.env}"
  role          = aws_iam_role.service_lambda_fn.arn

  image_uri     = data.aws_ecr_image.service.image_uri
  architectures = ["arm64"]
  package_type  = "Image"

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
      BT_AWS_MEDIA_BUCKET        = data.aws_s3_bucket.media.id
      BT_AWS_SQS_EMAIL_QUEUE_URL = aws_sqs_queue.email.id
      BT_BASE_URL                = "https://${var.web_domain}.${var.root_domain}/"
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
      BT_SESSION_COOKIE_DOMAIN   = "${var.web_domain}.${var.root_domain}"
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

### FRONTEND SSR
resource "aws_lambda_function" "ssr" {
  function_name = "bottomtime-ssr-${var.env}"
  role          = aws_iam_role.ssr_lambda_fn.arn

  image_uri     = data.aws_ecr_image.web.image_uri
  architectures = ["arm64"]
  package_type  = "Image"

  description = "BottomTime Server-Side Render Lambda Function"
  timeout     = 30

  logging_config {
    log_group  = aws_cloudwatch_log_group.ssr_logs.id
    log_format = "JSON"
  }

  tags = {
    Environment = var.env
    Region      = data.aws_region.current.name
  }

  environment {
    variables = {
      BTWEB_API_URL                = "https://${var.api_domain}.${var.root_domain}/"
      BTWEB_COOKIE_NAME            = var.cookie_name
      BTWEB_LOG_LEVEL              = var.log_level
      BTWEB_VITE_BASE_URL          = "https://${var.web_domain}.${var.root_domain}/"
      BTWEB_VITE_CONFIGCAT_API_KEY = var.configcat_sdk_key
      BTWEB_VITE_ENABLE_PLACES_API = "${var.enable_places_api}"
      BTWEB_VITE_GOOGLE_API_KEY    = local.secrets.googleApiKey
      NODE_ENV                     = "production"
    }
  }

  depends_on = [aws_cloudwatch_log_group.ssr_logs, aws_iam_role_policy_attachment.ssr_lambda_logging]
}

resource "aws_lambda_permission" "allow_ssr_call" {
  statement_id  = "allow_apigateway_${var.env}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ssr.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.ssr.execution_arn}/*/*"
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
      BT_BASE_URL      = "https://${var.web_domain}.${var.root_domain}/"
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
  event_source_arn = aws_sqs_queue.email.arn
  enabled          = true
  function_name    = aws_lambda_function.email_service.arn
}

### KEEP-ALIVE FUNCTION
data "archive_file" "keepalive" {
  type        = "zip"
  output_path = "${path.module}/archive/keepalive.zip"
  source_dir  = "${path.module}/../packages/keepalive/"
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
      BT_PING_URL = "https://${var.web_domain}.${var.root_domain}/"
    }
  }

  depends_on = [aws_cloudwatch_log_group.keepalive_logs, aws_iam_role_policy_attachment.keepalive_lambda_logging]
}

### EDGE AUTHENTICATION SERVICE FOR TEST ENVIRONMENTS
data "archive_file" "edge_authenticator" {
  type        = "zip"
  output_path = "${path.module}/archive/edge_auth.zip"
  source_dir  = "${path.module}/../packages/edge/dist/"
}

resource "aws_lambda_function" "edge_authenticator" {
  function_name = "bottomtime-edge-authenticator-${var.env}"
  role          = aws_iam_role.edge_authenticator_lambda_fn.arn

  filename         = data.archive_file.edge_authenticator.output_path
  source_code_hash = data.archive_file.edge_authenticator.output_base64sha256

  description = "Bottom Time platform authenticator. Allows users to log into protected environements using AWS Cognito."
  handler     = "index.handler"
  runtime     = "nodejs20.x"
  timeout     = 15

  logging_config {
    log_group  = aws_cloudwatch_log_group.edge_authenticator_logs.id
    log_format = "JSON"
  }

  environment {
    variables = {
      BT_EDGE_BASE_URL       = "https://${aws_route53_record.authentication.fqdn}"
      BT_EDGE_CLIENT_ID      = aws_cognito_user_pool_client.user_pool_client.id
      BT_EDGE_CLIENT_SECRET  = aws_cognito_user_pool_client.user_pool_client.client_secret
      BT_EDGE_COGNITO_DOMAIN = "https://${data.aws_cognito_user_pool.user_pool.domain}"
      BT_EDGE_COOKIE_NAME    = var.edgeauth_cookie_name
      BT_EDGE_SESSION_SECRET = local.edgeauth_config.sessionSecret
      BT_LOG_LEVEL           = var.log_level
      NODE_ENV               = "production"
    }
  }

  tags = {
    Environment = var.env
    Region      = data.aws_region.current.name
  }

  depends_on = [aws_cloudwatch_log_group.edge_authenticator_logs, aws_iam_role_policy_attachment.edge_authenticator_lambda_logging]
}

resource "aws_lambda_permission" "allow_edge_authenticator_api_call" {
  statement_id  = "allow_apigateway_${var.env}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.edge_authenticator.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.edge_authenticator.execution_arn}/*/*"
}
