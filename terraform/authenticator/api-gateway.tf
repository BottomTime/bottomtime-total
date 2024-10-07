resource "aws_apigatewayv2_api" "authenticator" {
  name          = "bottomtime-authenticator"
  protocol_type = "HTTP"

  cors_configuration {
    allow_credentials = true
    allow_headers     = ["*"]
    allow_methods     = ["GET", "POST", "OPTIONS"]
    allow_origins     = ["https://*"]
    max_age           = 300
    expose_headers    = ["set-cookie", "cookie"]
  }

  tags = {
    Region  = data.aws_region.current.name
    Service = "Authentication app for protected environments"
  }
}

resource "aws_apigatewayv2_domain_name" "authenticator" {
  domain_name = "${local.authentication_domain}.${var.root_domain}"

  domain_name_configuration {
    certificate_arn = data.aws_acm_certificate.main.arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_integration" "authenticator_lambda" {
  api_id                 = aws_apigatewayv2_api.authenticator.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.authenticator.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "authenticator" {
  api_id    = aws_apigatewayv2_api.authenticator.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.authenticator_lambda.id}"
}

resource "aws_apigatewayv2_stage" "authenticator" {
  api_id      = aws_apigatewayv2_api.authenticator.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.authenticator_logs.arn
    format = jsonencode({
      requestId               = "$context.requestId"
      sourceIp                = "$context.identity.sourceIp"
      requestTime             = "$context.requestTime"
      protocol                = "$context.protocol"
      httpMethod              = "$context.httpMethod"
      resourcePath            = "$context.resourcePath"
      routeKey                = "$context.routeKey"
      status                  = "$context.status"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
    })
  }
}

resource "aws_apigatewayv2_api_mapping" "service_authenticator_domain" {
  api_id      = aws_apigatewayv2_api.authenticator.id
  domain_name = aws_apigatewayv2_domain_name.authenticator.id
  stage       = aws_apigatewayv2_stage.authenticator.id
}
