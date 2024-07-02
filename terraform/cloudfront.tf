locals {
  web_s3_origin_id  = "web-s3-origin"
  web_api_origin_id = "web-api-origin"
}

resource "aws_cloudfront_cache_policy" "web" {
  name        = "bt-web-${var.env}-cache-policy"
  min_ttl     = 0
  default_ttl = 3600
  max_ttl     = 86400

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "whitelist"
      cookies {
        items = [var.cookie_name]
      }
    }

    headers_config {
      header_behavior = "whitelist"
      headers {
        items = ["Authorization"]
      }
    }

    query_strings_config {
      query_string_behavior = "all"
    }
  }
}

resource "aws_cloudfront_origin_access_identity" "web" {}

resource "aws_cloudfront_origin_request_policy" "web" {
  name = "bt-web-${var.env}-policy"
  cookies_config {
    cookie_behavior = "whitelist"
    cookies {
      items = ["${var.cookie_name}"]
    }
  }

  headers_config {
    header_behavior = "allViewer"
  }

  query_strings_config {
    query_string_behavior = "all"
  }
}

resource "aws_cloudfront_distribution" "web" {
  enabled     = true
  comment     = "Web front-end distribution"
  aliases     = ["${var.web_domain}.${var.root_domain}"]
  price_class = "PriceClass_100"

  # S3 bucket origin for static assets
  origin {
    domain_name = aws_s3_bucket.web.bucket_regional_domain_name
    origin_id   = local.web_s3_origin_id

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.web.cloudfront_access_identity_path
    }
  }

  # API Gateway origin for backend service APIsconnection
  # origin {
  #   domain_name = "${var.api_domain}.${var.root_domain}"
  #   origin_access_control_id = aws_cloudfront_origin_access_control.web.id
  #   origin_id = local.web_api_origin_id

  #   custom_origin_config {
  #     http_port = 80
  #     https_port = 443
  #     origin_protocol_policy = "https-only"
  #     origin_ssl_protocols = ["TLSv1.2"]
  #   }
  # }

  restrictions {
    geo_restriction {
      # locations = ["US", "CA"]
      restriction_type = "none" # "whitelist" ?
    }
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.main.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2019"
  }

  # Default to serving static files
  default_cache_behavior {
    target_origin_id = local.web_s3_origin_id
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    cache_policy_id  = aws_cloudfront_cache_policy.web.id

    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  # For requests to /api, invoke the Lambda function for the backend service
  # ordered_cache_behavior {
  #   target_origin_id = local.web_api_origin_id
  #   allowed_methods = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]
  #   cached_methods = ["GET", "HEAD", "OPTIONS"]
  #   path_pattern = "api/*"
  # origin_request_policy_id = aws_cloudfront_origin_request_policy.web.id

  #   min_ttl                = 0
  #   default_ttl            = 120
  #   max_ttl                = 3600
  #   viewer_protocol_policy = "redirect-to-https"
  # }

  # For all other requests, invoke the Lambda function for SSR
  # ordered_cache_behavior {
  #   allowed_methods = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]
  #   cached_methods = ["GET", "HEAD", "OPTIONS"]

  #   min_ttl                = 0
  #   default_ttl            = 120
  #   max_ttl                = 3600
  #   viewer_protocol_policy = "redirect-to-https"
  # }

  tags = {
    Region      = data.aws_region.current.name
    Environment = var.env
    Purpose     = "Web front-end application"
  }

  depends_on = [aws_apigatewayv2_api.service]
}
