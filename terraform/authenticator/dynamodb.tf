resource "aws_dynamodb_table" "auth" {
  name     = var.auth_table_name
  hash_key = "email"

  attribute {
    name = "email"
    type = "S"
  }

  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
}

resource "aws_dynamodb_table_item" "admin" {
  table_name = aws_dynamodb_table.auth.name
  hash_key   = aws_dynamodb_table.auth.hash_key

  item = <<ITEM
  {
    "email": { "S": "mrchriscarleton@gmail.com" },
    "domains": { "S": "bottomti.me,dev.bottomti.me,staging.bottomti.me,e2e.bottomti.me" }
  }
  ITEM
}
