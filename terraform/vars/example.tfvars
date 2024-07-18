### Config Variables
###   Set these variables to configure your environment.
###   The commented variables are optional. Uncomment them to override the default values.

admin_email       = "admin@bottomti.me"
api_domain        = "api-dev"
configcat_sdk_key = "<your-configcat-sdk_key>"
cookie_name       = "bottomtime.example"
docs_domain       = "docs-dev"
enable_places_api = false
env               = "dev"
log_level         = "info"
media_bucket      = "bottomtime-media-dev"
secure_cookie     = true
root_domain       = "bottomti.me"
web_domain        = "dev"

# This needs to match the name of the AWS Secrets Manager secret created for the current environment.
secret_name = "bt-service-dev-us-east-1-secrets"

# Uncomment the following variable if you want the environment to be publicly accessible. Otherwise, a signed cookie will be required for all requests.
# allow_public_access = true

# Optional variables
# password_salt_rounds = 12
