data "aws_ecr_repository" "service" {
  name = "bottomtime/service"
}

data "aws_ecr_image" "service" {
  repository_name = "bottomtime/service"
  # image_tag = "${var.env}-latest"
  image_tag = "latest"
}

data "aws_iam_policy_document" "service_lambda_policy" {
  statement {
    sid    = "BT Service Lambda - ${data.aws_region.current.name} - ${var.env}"
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
