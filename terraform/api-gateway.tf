### Backend API
resource "aws_apigatewayv2_api" "service" {
  name          = "bottomtime-service-${var.env}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_credentials = true
    allow_headers     = ["*"]
    allow_methods     = ["GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_origins     = ["https://${local.web_fqdn}", "https://${var.api_domain}.${var.root_domain}"]
    expose_headers    = ["set-cookie"]
    max_age           = 300
  }

  tags = {
    Environment = var.env
    Region      = data.aws_region.current.name
    Service     = "Backend APIs"
  }
}

resource "aws_apigatewayv2_domain_name" "service" {
  domain_name = "${var.api_domain}.${var.root_domain}"

  domain_name_configuration {
    certificate_arn = data.aws_acm_certificate.main.arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_integration" "service_lambda" {
  api_id                 = aws_apigatewayv2_api.service.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.service.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "service" {
  api_id    = aws_apigatewayv2_api.service.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.service_lambda.id}"
}

resource "aws_apigatewayv2_stage" "service" {
  api_id      = aws_apigatewayv2_api.service.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.service_logs.arn
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

resource "aws_apigatewayv2_api_mapping" "service_stage_domain" {
  api_id      = aws_apigatewayv2_api.service.id
  domain_name = aws_apigatewayv2_domain_name.service.id
  stage       = aws_apigatewayv2_stage.service.id
}
