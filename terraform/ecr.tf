data "aws_ecr_repository" "core" {
  name = local.image_name
}

resource "aws_ecr_lifecycle_policy" "core" {
  repository = data.aws_ecr_repository.core.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Retain last 5 images"
        action = {
          type = "expire"
        }
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 5
        }
      }
    ]
  })
}
