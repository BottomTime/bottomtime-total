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

  tags = {
    Environment = var.env
    Region      = data.aws_region.current.name
  }

  handler = "dist/sls.handler"
  runtime = "nodejs20.x"

  environment {
    variables = {
      BT_AWS_MEDIA_BUCKET      = aws_s3_bucket.media.id
      BT_BASE_URL              = "http://localhost:8402" # TODO: This needs to come from Route53
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
      BT_SESSION_COOKIE_DOMAIN = "" # TODO: This should come from Route53
      BT_SESSION_COOKIE_NAME   = local.cookie_name
      BT_SESSION_SECRET        = local.secrets.sessionSecret
      BT_SMTP_REPLY_TO         = "donotreply@bottomti.me"
      BT_SMTP_FROM             = "\"Bottom Time Admin\" <admin@bottomti.me>"
      BT_SMTP_HOST             = local.secrets.smtpHost
      BT_SMTP_PASSWORD         = local.secrets.smtpPassword
      BT_SMTP_USERNAME         = local.secrets.smtpUsername
      NODE_ENV                 = "production"
    }
  }
}
