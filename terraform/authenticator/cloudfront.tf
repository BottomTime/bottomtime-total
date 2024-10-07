locals {
  s3_origin_id  = "authenticator-s3-origin"
  api_origin_id = "authenticator-api-origin"
}

resource "aws_cloudfront_origin_access_identity" "authenticator" {}

resource "aws_cloudfront_cache_policy" "static_files" {
  name        = "bt-static-cache-policy"
  min_ttl     = 0
  default_ttl = 3600  # 1 hour
  max_ttl     = 86400 # 1 day

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "all"
    }
  }
}

resource "aws_cloudfront_cache_policy" "lambda" {
  name        = "bt-lambda-cache-policy"
  min_ttl     = 0
  default_ttl = 120
  max_ttl     = 3600

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
        items = ["Authorization", "Set-Cookie"]
      }
    }

    query_strings_config {
      query_string_behavior = "all"
    }
  }
}

resource "aws_cloudfront_distribution" "authenticator" {
  enabled     = true
  comment     = "Cache for static assets for authenticator"
  aliases     = ["${local.authentication_domain}.${var.root_domain}"]
  price_class = "PriceClass_100"

  # S3 bucket origin for static assets
  origin {
    origin_id   = local.s3_origin_id
    domain_name = aws_s3_bucket.assets.bucket_regional_domain_name

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.authenticator.cloudfront_access_identity_path
    }
  }

  # API Gateway origin for server-side rendering
  origin {
    origin_id   = local.api_origin_id
    domain_name = "${aws_apigatewayv2_api.authenticator.id}.execute-api.${data.aws_region.current.name}.amazonaws.com"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  restrictions {
    geo_restriction {
      locations        = ["US", "CA"]
      restriction_type = "whitelist"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.main.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2019"
  }

  # Static files are served from S3
  ordered_cache_behavior {
    target_origin_id       = local.s3_origin_id
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    path_pattern           = "*.*"
    cache_policy_id        = aws_cloudfront_cache_policy.static_files.id
    viewer_protocol_policy = "redirect-to-https"
  }

  # Default cache behaviour performs server-side rendering
  default_cache_behavior {
    target_origin_id       = local.api_origin_id
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    cache_policy_id        = aws_cloudfront_cache_policy.lambda.id
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  tags = {
    Region  = data.aws_region.current.name
    Purpose = "Web front-end application"
  }
}

