# Bottom Time Edge Authentication

This is a simple Lambda@Edge function that can optionally be enabled to restrict access to test environments.
When enabled in an environment, users will need to authenticate with AWS Cognito before CloudFront will allow
them to access the environment. This is useful for locking down dev environments.

## Setup

This function is dependent on an [AWS Cognito](https://aws.amazon.com/pm/cognito/) user pool to provide authentication
for authorized users to a given environment. If you have not done so already, please configure one following these guidelines:

1. Use a custom domain for the authentication UI. It should be a subdomain of the platform's root domain to ensure that the cookie
   will work across the entire environment.

## Configuration

The Lambda function requires a number of environment variables to be set in order work correctly with AWS Cognito.

| Variable                  | Description                                                                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AWS_REGION`              | Required to indicate the AWS region in which the Cognito user pool exists. (Default is `us-east-1`.)                                                  |
| `BT_AUTH_DOMAIN`          | The URL at which AWS Cognito will allow users to log in. (Must be a subdomain of `BT_COOKIE_DOMAIN`.) E.g. `https://auth.bottomti.me`.                |
| `BT_COOKIE_DOMAIN`        | The domain name to which the cookie issued by Cognito will be scoped to. Must match the root domain name for the platform. (Default is `bottomti.me`) |
| `BT_USER_POOL_ID`         | ID of the AWS Cognito user pool.                                                                                                                      |
| `BT_USER_POOL_APP_ID`     | The AWS Cognito user pool's app ID.                                                                                                                   |
| `BT_USER_POOL_APP_SECRET` | The AWS Cognito user pool's app secret.                                                                                                               |
