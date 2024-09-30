data "aws_ecr_repository" "service" {
  name = "bottomtime/service"
}

data "aws_ecr_repository" "web" {
  name = "bottomtime/web"
}

data "aws_ecr_image" "service" {
  repository_name = "bottomtime/service"
  image_tag       = "${var.env}-latest"
}

data "aws_ecr_image" "web" {
  repository_name = "bottomtime/web"
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

resource "aws_ecr_repository_policy" "web_lambda_policy" {
  repository = data.aws_ecr_repository.web.name
  policy     = data.aws_iam_policy_document.service_lambda_policy.json
}
