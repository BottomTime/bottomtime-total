data "aws_secretsmanager_secret" "secrets" {
  name = var.secret_name
}

data "aws_secretsmanager_secret_version" "secrets" {
  secret_id = data.aws_secretsmanager_secret.secrets.id
}

locals {
  secrets = jsondecode(data.aws_secretsmanager_secret_version.secrets.secret_string)
}
