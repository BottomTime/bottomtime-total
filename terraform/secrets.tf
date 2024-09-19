data "aws_secretsmanager_secret" "secrets" {
  name = var.secret_name
}

data "aws_secretsmanager_secret_version" "secrets" {
  secret_id = data.aws_secretsmanager_secret.secrets.id
}

data "aws_secretsmanager_secret" "edgeauth" {
  name = var.edgeauth_config_secret
}

data "aws_secretsmanager_secret_version" "edgeauth" {
  secret_id = data.aws_secretsmanager_secret.edgeauth.id
}

locals {
  secrets         = jsondecode(data.aws_secretsmanager_secret_version.secrets.secret_string)
  edgeauth_config = jsondecode(data.aws_secretsmanager_secret_version.edgeauth.secret_string)
}
