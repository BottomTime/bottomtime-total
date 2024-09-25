locals {
  cognito_callback_url = "https://${aws_route53_record.authentication.fqdn}/callback"
}

resource "aws_cognito_user_pool" "bt_devs" {
  name = "Bottom Time Developers"

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }

    recovery_mechanism {
      name     = "verified_phone_number"
      priority = 2
    }
  }

  admin_create_user_config {
    allow_admin_create_user_only = true

    invite_message_template {
      email_message = "Your username is {username} and temporary password is {####}."
      email_subject = "Please activate your Bottom Time developer account."
      sms_message   = "Please activate your Bottom Time developer account. Your username is {username} and temporary password is {####}."
    }
  }

  auto_verified_attributes = ["email"]
  deletion_protection      = "ACTIVE"
  mfa_configuration        = "ON"

  software_token_mfa_configuration {
    enabled = true
  }

  user_attribute_update_settings {
    attributes_require_verification_before_update = ["email"]
  }
}

resource "aws_cognito_user_pool_client" "user_pool_client" {
  user_pool_id = aws_cognito_user_pool.bt_devs.id
  name         = "Bottom Time Auth Client"

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  supported_identity_providers         = ["COGNITO"]

  callback_urls        = [local.cognito_callback_url, "http://localhost:9000/callback"]
  default_redirect_uri = local.cognito_callback_url
  logout_urls          = ["https://${aws_route53_record.authentication.fqdn}/logout"]

  explicit_auth_flows = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  generate_secret     = true
}

resource "aws_cognito_user_pool_domain" "cognito_domain" {
  domain          = "${local.cognito_domain}.${var.root_domain}"
  user_pool_id    = aws_cognito_user_pool.bt_devs.id
  certificate_arn = data.aws_acm_certificate.main.arn
}
