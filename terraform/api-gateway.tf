resource "aws_apigatewayv2_api" "service" {
  name          = "bottomtime-service-${var.env}"
  protocol_type = "HTTP"
}
