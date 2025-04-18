data "aws_ecr_lifecycle_policy_document" "remove_untagged" {
  rule {
    priority    = 1
    description = "Expire untagged images after two days."
    selection {
      tag_status   = "untagged"
      count_type   = "sinceImagePushed"
      count_unit   = "days"
      count_number = 2
    }
    action {
      type = "expire"
    }
  }
}

data "aws_ecr_repository" "service" {
  name = "bottomtime/service"
}

data "aws_ecr_image" "service" {
  repository_name = "bottomtime/service"
  image_tag       = "${var.env}-latest"
}

data "aws_iam_policy_document" "service_lambda_policy" {
  statement {
    sid    = "BT Lambda Policy"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = [
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
    ]
  }
}

resource "aws_ecr_repository_policy" "service_lambda_policy" {
  repository = data.aws_ecr_repository.service.name
  policy     = data.aws_iam_policy_document.service_lambda_policy.json
}

resource "aws_ecr_lifecycle_policy" "service_image_lifecycle" {
  repository = data.aws_ecr_repository.service.name
  policy     = data.aws_ecr_lifecycle_policy_document.remove_untagged.json
}
