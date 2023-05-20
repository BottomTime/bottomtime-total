locals {
  api_origin_id = "${var.service_name_short}_api_origin_${var.env}"
  s3_origin_id  = "${var.service_name_short}_s3_origin_${var.env}"
}

resource "aws_cloudfront_origin_access_control" "default" {
  name                              = "S3 Access Control"
  description                       = "S3 Access Control"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_cache_policy" "web" {
  name = "${var.service_name_short}-${var.env}-web-cache-policy"

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

resource "aws_cloudfront_cache_policy" "docs" {
  name = "${var.service_name_short}-${var.env}-docs-cache-policy"

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

resource "aws_cloudfront_cache_policy" "api" {
  name = "${var.service_name_short}-${var.env}-api-cache-policy"

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "whitelist"
      cookies {
        items = [local.session_cookie_name]
      }
    }

    headers_config {
      header_behavior = "whitelist"
      headers {
        items = [
          "Accept",
          "Accept-Encoding",
          "Accept-Language",
          "Host",
          "Referer",
          "User-Agent"
        ]
      }
    }

    query_strings_config {
      query_string_behavior = "all"
    }
  }
}


# Vue Application Distribution
resource "aws_cloudfront_distribution" "web" {
  aliases = var.env == "production" ? ["${var.site_domain}.${var.hosted_zone}", var.hosted_zone] : ["${var.site_domain}.${var.hosted_zone}"]
  comment = ""

  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/index.html"
  }

  origin {
    domain_name              = aws_s3_bucket.web.bucket_regional_domain_name
    origin_id                = local.s3_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.default.id
  }

  origin {
    domain_name = aws_alb.alb.dns_name
    origin_id   = local.api_origin_id

    # TODO: Add API token here.
    # custom_header {
    #   name = "Authorization"
    #   value = ""
    # }

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.1", "TLSv1.2"]
    }
  }

  ordered_cache_behavior {
    allowed_methods        = ["HEAD", "GET", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]
    cached_methods         = ["HEAD", "GET", "OPTIONS"]
    cache_policy_id        = aws_cloudfront_cache_policy.api.id
    path_pattern           = "/api/*"
    target_origin_id       = local.api_origin_id
    viewer_protocol_policy = "https-only"
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    cache_policy_id        = aws_cloudfront_cache_policy.web.id
    compress               = true
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"
  }

  enabled             = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.alb.arn
    minimum_protocol_version = "TLSv1"
    ssl_support_method       = "sni-only"
  }

  # TODO: Open this up or make it configurable.
  restrictions {
    geo_restriction {
      locations        = ["CA"]
      restriction_type = "whitelist"
    }
  }
}


# Documentation Distribution
resource "aws_cloudfront_distribution" "docs" {
  aliases = ["${var.docs_domain}.${var.hosted_zone}"]
  comment = ""

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  origin {
    domain_name              = aws_s3_bucket.docs.bucket_regional_domain_name
    origin_id                = local.s3_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.default.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    cache_policy_id        = aws_cloudfront_cache_policy.docs.id
    compress               = true
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"
  }

  enabled             = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.alb.arn
    minimum_protocol_version = "TLSv1"
    ssl_support_method       = "sni-only"
  }

  # TODO: Open this up or make it configurable.
  restrictions {
    geo_restriction {
      locations        = ["CA"]
      restriction_type = "whitelist"
    }
  }
}
