data "archive_file" "authenticator" {
  type        = "zip"
  output_path = "${path.module}/archive/edge_auth.zip"
  source_dir  = "${path.module}/../../packages/edge-authenticator/dist/"
}

resource "aws_lambda_function" "authenticator" {
  function_name = "bottomtime-authenticator"
  role          = aws_iam_role.authenticator_lambda_fn.arn

  filename         = data.archive_file.authenticator.output_path
  source_code_hash = data.archive_file.authenticator.output_base64sha256

  description = "Bottom Time platform authenticator. Allows users to log into protected environements using AWS Cognito."
  handler     = "index.handler"
  runtime     = "nodejs20.x"
  timeout     = 15

  logging_config {
    log_group  = aws_cloudwatch_log_group.authenticator_logs.id
    log_format = "JSON"
  }

  environment {
    variables = {
      BT_EDGE_BASE_URL             = "https://${local.authentication_domain}.${var.root_domain}"
      BT_EDGE_COOKIE_NAME          = var.cookie_name
      BT_EDGE_COOKIE_DOMAIN        = var.root_domain
      BT_EDGE_DYNAMODB_USERS_TABLE = var.auth_table_name
      BT_EDGE_GOOGLE_CLIENT_ID     = local.auth_config.googleClientId
      BT_EDGE_GOOGLE_CLIENT_SECRET = local.auth_config.googleClientSecret
      BT_EDGE_SESSION_SECRET       = local.auth_config.sessionSecret
      BT_LOG_LEVEL                 = var.log_level
      NODE_ENV                     = "production"
    }
  }

  tags = {
    Region = data.aws_region.current.name
  }

  depends_on = [aws_cloudwatch_log_group.authenticator_logs, aws_iam_role_policy_attachment.authenticator_lambda_logging]
}

resource "aws_lambda_permission" "allow_edge_authenticator_api_call" {
  statement_id  = "allow_apigateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.authenticator.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.authenticator.execution_arn}/*/*"
}
