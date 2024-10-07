### Config Variables
###   Set these variables to configure your environment.
###   The commented variables are optional. Uncomment them to override the default values.

# Disable this for publicly-accessible environments.
edgeauth_enabled = true

admin_email            = "admin@bottomti.me"
api_domain             = "api-dev"
configcat_sdk_key      = "<your-configcat-sdk_key>"
cookie_name            = "bottomtime.example"
docs_domain            = "docs-dev"
edgeauth_config_secret = "bt-edgeauth-config"
edgeauth_cookie_name   = "bottomtime.auth"
enable_keep_alive      = false
enable_places_api      = false
env                    = "dev"
log_level              = "info"
log_retention_days     = 7
media_bucket           = "bottomtime-media-dev"
password_salt_rounds   = 12
secret_name            = "bt-service-dev-us-east-1-secrets" # This needs to match the name of the AWS Secrets Manager secret created for the current environment.
secure_cookie          = true
root_domain            = "bottomti.me"
web_domain             = "dev"
