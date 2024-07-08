### BACKEND API
data "archive_file" "service" {
  type        = "zip"
  output_path = "${path.module}/archive/service.zip"
  source_dir  = "${path.module}/../packages/service/dist/"
}

resource "aws_lambda_function" "service" {
  function_name = "bottomtime-service-${var.env}"
  role          = aws_iam_role.service_lambda_fn.arn

  filename         = data.archive_file.service.output_path
  source_code_hash = data.archive_file.service.output_base64sha256

  description = "BottomTime Backend Service Lambda Function"
  handler     = "sls.handler"
  runtime     = "nodejs20.x"
  timeout     = 30
  memory_size = 256

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
      BT_AWS_MEDIA_BUCKET      = data.aws_s3_bucket.media.id
      BT_BASE_URL              = "https://${var.web_domain}.${var.root_domain}/"
      BT_LOG_LEVEL             = var.log_level
      BT_DISCORD_CLIENT_ID     = local.secrets.discordClientId
      BT_DISCORD_CLIENT_SECRET = local.secrets.discordClientSecret
      BT_GITHUB_CLIENT_ID      = local.secrets.githubClientId
      BT_GITHUB_CLIENT_SECRET  = local.secrets.githubClientSecret
      BT_GOOGLE_CLIENT_ID      = local.secrets.googleClientId
      BT_GOOGLE_CLIENT_SECRET  = local.secrets.googleClientSecret
      BT_PASSWORD_SALT_ROUNDS  = "${var.password_salt_rounds}"
      BT_POSTGRES_REQUIRE_SSL  = "true"
      BT_POSTGRES_URI          = local.secrets.postgresUri
      BT_SESSION_COOKIE_DOMAIN = "${var.web_domain}.${var.root_domain}"
      BT_SESSION_COOKIE_NAME   = local.cookie_name
      BT_SESSION_SECRET        = local.secrets.sessionSecret
      BT_SESSION_SECURE_COOKIE = "${var.secure_cookie}"
      BT_SMTP_REPLY_TO         = "donotreply@bottomti.me"
      BT_SMTP_FROM             = "\"Bottom Time Admin\" <admin@bottomti.me>"
      BT_SMTP_HOST             = local.secrets.smtpHost
      BT_SMTP_PASSWORD         = local.secrets.smtpPassword
      BT_SMTP_USERNAME         = local.secrets.smtpUsername
      NODE_ENV                 = "production"
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
data "archive_file" "ssr" {
  type        = "zip"
  output_path = "${path.module}/archive/ssr.zip"
  source_dir  = "${path.module}/../packages/web/dist/"
}

resource "aws_lambda_function" "ssr" {
  function_name = "bottomtime-ssr-${var.env}"
  role          = aws_iam_role.ssr_lambda_fn.arn

  filename         = data.archive_file.ssr.output_path
  source_code_hash = data.archive_file.ssr.output_base64sha256

  description = "BottomTime Server-Side Render Lambda Function"
  handler     = "sls-entry.handler"
  runtime     = "nodejs20.x"
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
