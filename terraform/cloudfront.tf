locals {
  docs_origin_id    = "docs-origin"
  web_s3_origin_id  = "web-s3-origin"
  web_api_origin_id = "web-api-origin"
}

resource "aws_cloudfront_cache_policy" "web_static" {
  name        = "bt-web-static-${var.env}-cache-policy"
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

    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true
  }
}

resource "aws_cloudfront_cache_policy" "docs_static" {
  name        = "bt-docs-static-${var.env}-cache-policy"
  min_ttl     = 0
  default_ttl = 86400  # 1 day
  max_ttl     = 604800 # 1 week

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

resource "aws_cloudfront_cache_policy" "api_lambda" {
  name        = "bt-apis-${var.env}-cache-policy"
  comment     = "Cache policy for forwarding requests to '/api' the bakckend"
  min_ttl     = 0
  max_ttl     = 5
  default_ttl = 5

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "whitelist"
      cookies {
        items = [local.cookie_name, var.edgeauth_cookie_name]
      }
    }

    headers_config {
      header_behavior = "whitelist"

      headers {
        items = ["Authorization", "x-bt-auth", "User-Agent"]
      }
    }

    query_strings_config {
      query_string_behavior = "all"
    }

    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true
  }
}

resource "aws_cloudfront_origin_access_identity" "web" {}
resource "aws_cloudfront_origin_access_identity" "docs" {}

resource "aws_cloudfront_distribution" "web" {
  enabled             = true
  comment             = "Web front-end distribution"
  aliases             = var.web_domain == "" ? [local.web_fqdn, "www.${var.root_domain}"] : [local.web_fqdn]
  price_class         = "PriceClass_100"
  default_root_object = "index.html"

  # S3 bucket origin for static assets
  origin {
    origin_id   = local.web_s3_origin_id
    domain_name = aws_s3_bucket.web.bucket_regional_domain_name

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.web.cloudfront_access_identity_path
    }
  }

  # API Gateway origin for processing API requests to the backend
  origin {
    origin_id   = local.web_api_origin_id
    domain_name = "${aws_apigatewayv2_api.service.id}.execute-api.${data.aws_region.current.name}.amazonaws.com"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  restrictions {
    geo_restriction {
      # TODO: Open this up later.
      locations        = ["US", "CA"]
      restriction_type = "whitelist"
      # restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.main.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2019"
  }

  # For requests to /api, invoke the Lambda function for the backend service
  ordered_cache_behavior {
    target_origin_id       = local.web_api_origin_id
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    path_pattern           = "api/*"
    viewer_protocol_policy = "redirect-to-https"

    cache_policy_id = aws_cloudfront_cache_policy.api_lambda.id
  }

  # Static files are served from S3
  default_cache_behavior {
    target_origin_id       = local.web_s3_origin_id
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    cache_policy_id = aws_cloudfront_cache_policy.web_static.id
  }

  # For unknown routes, serve up the index.html page and let the Vue router figure out what to do.
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  tags = {
    Region      = data.aws_region.current.name
    Environment = var.env
    Purpose     = "Web front-end application"
  }
}

resource "aws_cloudfront_distribution" "docs" {
  enabled             = true
  comment             = "API documentation distribution"
  aliases             = ["${var.docs_domain}.${var.root_domain}"]
  price_class         = "PriceClass_100"
  default_root_object = "index.html"

  # S3 bucket origin for static assets
  origin {
    origin_id   = local.docs_origin_id
    domain_name = aws_s3_bucket.docs.bucket_regional_domain_name

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.docs.cloudfront_access_identity_path
    }
  }

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

  # Default cache behaviour performs server-side rendering
  default_cache_behavior {
    target_origin_id       = local.docs_origin_id
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    cache_policy_id        = aws_cloudfront_cache_policy.docs_static.id
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  tags = {
    Region      = data.aws_region.current.name
    Environment = var.env
    Purpose     = "API documentation for Bottom Time platform"
  }
}
