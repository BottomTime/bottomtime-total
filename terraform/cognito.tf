locals {
  cognito_callback_url = "https://${aws_route53_record.authentication.fqdn}/callback"
}

data "aws_cognito_user_pool" "user_pool" {
  user_pool_id = var.cognito_user_pool
}

resource "aws_cognito_user_pool_client" "user_pool_client" {
  user_pool_id = data.aws_cognito_user_pool.user_pool.id
  name         = "Bottom Time Auth Client - ${var.env}"

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid"]
  supported_identity_providers         = ["COGNITO"]

  callback_urls        = [local.cognito_callback_url, "http://localhost:9000/callback"]
  default_redirect_uri = local.cognito_callback_url
  logout_urls          = ["https://${aws_route53_record.authentication.fqdn}/logout"]

  explicit_auth_flows = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  generate_secret     = true
}
