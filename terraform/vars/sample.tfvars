### Config Variables
###   Set these variables to configure your environment.
###   The commented variables are optional. Uncomment them to override the default values.

cookie_name = "bottomtime.example"
env         = "dev"
log_level   = "info"

# This needs to match the name of the AWS Secrets Manager secret created for the current environment.
secret_name = "bt-service-dev-us-east-1-secrets"

# Optional variables
# cookie_name = "bottomtime.local"
# password_salt_rounds = 15
