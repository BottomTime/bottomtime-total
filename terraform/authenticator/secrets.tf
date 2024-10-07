data "aws_secretsmanager_secret" "auth" {
  name = var.secret_name
}

data "aws_secretsmanager_secret_version" "auth" {
  secret_id = data.aws_secretsmanager_secret.auth.id
}

locals {
  auth_config = jsondecode(data.aws_secretsmanager_secret_version.auth.secret_string)
}
