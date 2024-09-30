### Config Variables
###   Set these variables to configure your environment.
###   The commented variables are optional. Uncomment them to override the default values.
edgeauth_enabled = true

admin_email            = "admin@bottomti.me"
api_domain             = "api-staging"
configcat_sdk_key      = "configcat-sdk-1/L7LcCHeN9EiJIg19Uj9Fgw/qUo-JQp0d0qBb85NqkKIPw"
cookie_name            = "bottomtime.staging"
docs_domain            = "docs-staging"
edgeauth_cookie_name   = "bottomtime.staging.auth"
edgeauth_config_secret = "bt-edgeauth-config"
enable_places_api      = false
env                    = "staging"
log_level              = "info"
media_bucket           = "bottomtime-media-staging"
root_domain            = "bottomti.me"
secure_cookie          = true
web_domain             = "staging"

# This needs to match the name of the AWS Secrets Manager secret created for the current environment.
secret_name = "bt-service-staging"

# Optional variables
# password_salt_rounds = 12
