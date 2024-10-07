### Config Variables
###   Set these variables to configure your environment.
###   The commented variables are optional. Uncomment them to override the default values.
edgeauth_enabled = true

admin_email            = "admin@bottomti.me"
api_domain             = "api-e2e"
configcat_sdk_key      = "configcat-sdk-1/L7LcCHeN9EiJIg19Uj9Fgw/ulNsabWeG0y5GnfLl7ZZrA"
cookie_name            = "bottomtime.e2e"
docs_domain            = "docs-e2e"
edgeauth_config_secret = "bt-edgeauth-config"
enable_places_api      = false
env                    = "e2e"
log_level              = "trace"
media_bucket           = "bottomtime-media-e2e"
secure_cookie          = true
root_domain            = "bottomti.me"
web_domain             = "e2e"

# This needs to match the name of the AWS Secrets Manager secret created for the current environment.
secret_name = "bt-service-e2e"

# Optional variables
password_salt_rounds = 1
