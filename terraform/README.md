# Terraform Deployment

This directory contains all of the Terraform files necessary for deploying new environments.

## Protected Environments

Most environments will be for development/testing and should not be accessible to the general public. For this,
the Edge Authorization mechanism exists. This is configured and deployed as a global asset, serving all environments.

When enabled on an environment - see the `edgeauth_enabled` variable, described below - an additional authorization JWT will need to be
provided in requests to both the front- and back-end services. Requests to protected environments must provide the JWT in one of two places
in every request:

1. In the `x-bt-auth` header or
2. In the `bottomtime.auth` session cookie.

A utility exists to authenticate users and provide the JWT. The steps for deploying that service follow:

### Deploying the Edge Authenticator Service

> **IMPORTANT:** This service is meant to exist globally and serve all environments and so only needs to be deployed _once_!

#### Create a Google OAuth2.0 Client

Google's OAuth2.0 federated authentication service is used for logging in because storing passwords is lame. Go to the
[Google Dev Console](https://console.cloud.google.com/apis/credentials) and create a new OAuth2.0 Client ID. Make note
of the client ID and secret for later.

#### Create Configuration in AWS Secrets Manager

First, you'll need to create a Secrets Manager secret with the following values:

- `sessionSecret` - The secret used to sign the JWT. This should be set to a long, random, hard-to-guess string.
- `googleClientId` / `googleClientSecret` - Add the OAuth client ID/secret pair from the previous step.

You can name the secret whatever you like but, by default, `bt-edgeauth-config` is used across the platform. If you want to
avoid a bunch of additional configuration, just use that.

#### Build the Authenticator Package

From the repository root directory run

```bash
NODE_ENV=production yarn build --scope @bottomtime/edge-authenticator
```

#### Deploy the Authenticator

Finally, you can use Terraform to deploy the authenticator app. The authenticator app has its own Terraform files. They are under
`terraform/authenticator/`. You'll want to `cd` into that directory before you begin.

Next, you'll want to look at the `variables.tf` file so that you understand the default configuration. The default configuration is
recommended, but you may need to modify some of the variables.

Next initialize the Terraform backend. Terraform will store the state (`.tfstate` file) to an S3 bucket so that it is preserved for
the future. If you have not done so already, create an S3 bucket for storing Terraform state files. Now run

```bash
terraform init \
  -backend-config="bucket=<aws_bucket>" \
  -backend-config="key=authenticator.tfstate" \
  -backend-config="region=<aws_region>"
```

where `<aws_bucket>` is the name of the S3 bucket you created and `<aws_region>` is the name of the AWS region in which you want the
authenticator deployed to. (E.g. `us-east-1`.)

Finally, deploy the authenticator:

```bash
terraform apply
```

## Deployment Steps

Here are the steps needed to deploy a new environment. These steps need to be completed manually through the AWS console
or using the AWS APIs.

### First! Ensure AWS Access

Before you begin, you will need to have the AWS CLI installed. The CLI will need to be in your `$PATH` environment variable, and it will need
to be configured with access to an AWS account with sufficient privileges to perform the deployment.

Terraform will need to run as an IAM user with sufficient permission to deploy the platform. Create an IAM role with the following permissions:

- `AmazonAPIGatewayAdministrator`
- `AmazonEC2ContainerRegistryFullAccess`
- `AmazonEventBridgeSchedulerFullAccess`
- `AmazonRoute53FullAccess`
- `AmazonS3FullAccess`
- `AWSCertificateManagerReadOnly`
- `AWSLambda_FullAccess`
- `AmazonSQSFullAccess`
- `CloudFrontFullAccess`
- `CloudWatchLogsFullAccess`
- `SecretsManagerReadWrite`

Additionally, attach the following inline policies:

#### IAMManageRoles

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VisualEditor0",
      "Effect": "Allow",
      "Action": [
        "iam:GetRole",
        "iam:ListRoles",
        "iam:ListRolePolicies",
        "iam:GetRolePolicy",
        "iam:CreatePolicy",
        "iam:CreatePolicyVersion",
        "iam:CreateServiceLinkedRole",
        "iam:DeletePolicyVersion",
        "iam:GetRole",
        "iam:GetPolicy",
        "iam:GetPolicyVersion",
        "iam:ListRoleTags",
        "iam:ListAttachedRolePolicies",
        "iam:ListInstanceProfilesForRole",
        "iam:ListPolicyVersions",
        "iam:UpdateRoleDescription",
        "iam:DeletePolicy",
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:UpdateRole",
        "iam:PutRolePolicy",
        "iam:ListRolePolicies",
        "iam:GetRolePolicy",
        "iam:UpdateAssumeRolePolicy"
      ],
      "Resource": ["*"]
    }
  ]
}
```

Once this role has been created, create a user and associate the user with the role, then generate an access key id/secret access key pair to allow
Terraform to authenticate as this user.

## Shared Resources

A handful of resources will need to be shared between all environments and regions. These resources will not be created by Terraform which is meant
to deploy one environment at a time. As such, these resources will need to be created manually using the AWS console or CLI. These only need to be
created once and then shared between all environments.

### Route 53 Hosted Zone

A Route53 hosted zone needs to be established with a valid domain name. This will be used to resolved all of the domain names for the platform.
When configuring a new environment the `root_domain` variable in the corresponding `.tfvars` file needs to be set to the FQDN of this hosted zone.

### ACM Certificate

An ACM certificate will need to be created for the previously-created hosted zone. The certificate will need to be for `<domain_name>` and
`*.<domain_name>` - in that order - where `<domain_name>` is the FQDN for the hosted zone. This certificate will be used to facilitate secure,
TLS-based communication with the platform services.

### ECR Repositories

A couple of ECR repositories need to be created to publish/retrieve the service and front-end Docker conatiners to and from. In ECR create two
repositories called

- `bottomtime/service` and
- `bottomtime/web`

> **NOTE:** Tag mutability must be enabled since deployment will continuously overwrite the `{env}-latest` tag.

## Creating a New Terraformed Environment

Follow these steps to deploy the platform to a new environment.

### 1. Create (or Re-use) a Media Bucket

An S3 bucket will need to exist to store the user-generated content like pictures and videos.

> **NOTE:** Each environment (i.e. dev, staging, prod, etc.) ought to share a single bucket - even if the environments are deployed
> to multiple AWS regions. That is, only create a new bucket when deploying a new environment. If deploying an existing environment to
> a new AWS region, the bucket should be shared.

The following command can be run from your shell to create the bucket.

```bash
aws s3api create-bucket \
    --bucket <media_bucket> \
    --region <aws_region> \
    --object-ownership BucketOwnerEnforced
```

You will need to make the following substitutions:

- `<media_bucket>` - The name of the bucket. Ideally, the name should include the name of the environment it is being deployed for.
  E.g. `bottomtime-media-staging`.
- `<aws_region>` - AWS region in which the bucket should reside. E.g. `eu-west-1`.

> :exclamation: Make a note of the bucket name. You will need to provide it in your environment's configuration later.

### 2. Define Environment Secrets

For a new environment you will need to create a new secret in AWS Secrets Manager. It will need to be a key/value-pair secret with the following
values specified:

- `discordClientId` - Client ID for Discord OAuth.
- `discordClientSecret` - Client secret for Discord OAuth.
- `githubClientId` - Client ID for Github OAuth.
- `githubClientSecret` - Client secret for Github OAuth.
- `googleApiKey` - Google API key for accessing Maps and Places APIs.
- `googleClientId` - Client ID for Google OAuth.
- `googleClientSecret` - Client secret for Google OAuth.
- `postgresUri` - The connection string needed to connect to the Postgres database.
- `redisUri` - The connection string needed to connect to the Redis cache.
- `sessionSecret` - A string used to encrypt the JWT authentication token. This should, ideally, be a long, randomly-generated string.
- `smtpHost` - Domain name of the SMTP server that will be used to send emails to users.
- `smtpPassword` - Password used to authenticate with the SMTP server.
- `smtpUsername` - Username used to authenticate with the SMTP server.
- `stripeSdkKey` - Stripe SDK key (secret key) used to access Stripe APIs.
- `stripeWebhookSecret` - Stripe webhook signing secret used for verifying webhook requests.

> :exclamation: Make a note of the name of the secret. You will need to provide it in your environment's configuration later.

### 3. Create a .tfvars File

In the `terraform/vars/` directory, you will need to make a copy of the `example.tfvars` file and name the copy after the new environment
(e.g. `staging.tfvars`).

Now edit the new `.tfvars` file to set the values of the variables to match your environment's needs. Here are the variables needed to
configure your new environment:

| Variable                 | Description                                                                                                                                                                                                                                                     | Default              | Required |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | :------: |
| `admin_email`            | Email address of the site administrator.                                                                                                                                                                                                                        |                      |   Yes    |
| `api_domain`             | The partial domain name at which the backend APIs will respond to requests. (e.g. api-staging)                                                                                                                                                                  |                      |   Yes    |
| `config_cat_sdk_key`     | The SDK key for accessing the ConfigCat feature flags.                                                                                                                                                                                                          |                      |   Yes    |
| `cookie_name`            | Name of the session cookie as it will appear in the browser. **IMPORTANT:** This needs to be unique per environment but the same per region. I.e. all "staging" environments should use the same cookie name regardless of which AWS regions it is deployed to. | `bottomtime`         |    No    |
| `docs_domain`            | The sub domain at which the API documentation can be accessed.                                                                                                                                                                                                  |                      |   Yes    |
| `edgeauth_enabled`       | Indicates whether this is a protected environment. Protected environments require an additional JWT in the request header/cookie to access the site. (Used for non-public development environments.)                                                            | `false`              |    No    |
| `edgeauth_config_secret` | The name of the AWS Secrets Manager secret where the edge authorization configuration is stored.                                                                                                                                                                | `bt-edgeauth-config` |    No    |
| `edgeauth_cookie_name`   | Name of the session cookie to look for when retrieving the edge authorization JWT                                                                                                                                                                               | `bottomtime.auth`    |    No    |
| `enable_keep_alive`      | Indicates whether an EventBridge scheduled task will be enabled to occasionally ping the front-/back-end services to keep the Lambdas in memory and avoid cold starts.                                                                                          | `false`              |    No    |
| `enable_places_api`      | Indicates whether calls should be made to Google Places API. Default is false because this can be expensive and should only be enabled when needed.                                                                                                             | `false`              |    No    |
| `env`                    | The environment in which the resources are being created. E.g. dev, stage, prod, etc.                                                                                                                                                                           |                      |   Yes    |
| `keepalive_interval`     | The interval (in minutes) at which the keep-alive Lambda function should be run. It will ping the site homepage to keep the lambdas warmed up to avoid cold starts.                                                                                             | `30`                 |          |
| `log_level`              | The level of verbosity at which events will be written to the log stream. One of `trace`, `debug`, `info`, `warn`, `error`, or `fatal`.                                                                                                                         | `info`               |    No    |
| `log_retention_days`     | The number of days to retain log events in the Cloudwatch log groups.                                                                                                                                                                                           | `7`                  |    No    |
| `media_bucket`           | Name of the AWS S3 bucket where user-generated media (video, pictures, etc.) will be stored. This needs to be set to the name of the S3 bucket from step 1.                                                                                                     |                      |   Yes    |
| `password_salt_rounds`   | Number of rounds to use when computing a salted password hash. More will be more secure but slower.                                                                                                                                                             | `12`                 |    No    |
| `root_domain`            | The root domain for the service. Other domains will be created under this domain. This needs to be set to the FQDN of the Route53 hosted zone that was created for the platform. (See above.)                                                                   |                      |   Yes    |
| `secret_name`            | The name of the AWS Secrets Manager secret that contains the sensitive configuration values. This needs to be set to the name of the secret you created in step 2.                                                                                              |                      |   Yes    |
| `secure_cookie`          | Indicates whether the session cookie should be issued with the "secure" flag on. (I.e. the cookie will only be valid over HTTPS, not HTTP.)                                                                                                                     | `true`               |    No    |
| `web_domain`             | Partial domain name at which the front-end web application will respond to requests. (E.g. 'staging', 'www', etc.)                                                                                                                                              |                      |   Yes    |

### 4. Initialize Terraform State Provider

We use Terraform's AWS S3 state provider to maintain our state files (`.tfstate`) in an S3 bucket. The `terraform init` command will
allow you to configure Terraform to write the state files to the appropriate bucket.

> :exclamation: This command will need to be run from the `terraform/` directory in the repository root.

> :exclamation: This command only needs to be run once per environment. Once Terraform has been initialized, you can run multiple commands,
> (`plan`, `apply`, `destroy`, etc.) to the same environment without re-initialization.

> :exclamation: If you've already initialized Terraform and you need to switch to working on a different environment then you must re-initialize
> Terraform for the new environment. Use the same command as below, adding the `-reconfigure` flag.

```bash
terraform init \
  -backend-config="bucket=<aws_bucket>" \
  -backend-config="key=<tfstate_key>" \
  -backend-config="region=<aws_region>"
```

Make the following substitutions in the command:

- `<aws_bucket>` is the name of an AWS S3 bucket where the Terraform state file will be stored. (Obviously, you will need write access to this bucket.)
- `<tfstate_key>` is the object key under which the state file for your environment will be stored. This allows mutliple state files to be stored in a
  shared bucket. Ideally, the key should be inidicative of both the environment and the where it is being deployed. E.g. `dev.us-west-1.tfstate`.
- `<aws_region>` is the AWS region to which your environment will be deployed. E.g. `ca-central-1`.

### 5. Deploy Your New Environment

> **First!** You must build the platform if you haven't done so already. Run `yarn build` from the root directory of the repository to do so.
> This step is required to ensure that the Lambda function for the backend is deployed with the latest build.

To deploy your new environment run the following command from the `terraform/` directory in the repository root:

```bash
terraform apply -var-file=vars/your_env.tfvars
```

To tear down an environment that you are finished with (to clean up resources and avoid paying Amazon for unused resources) run:

```bash
terraform destroy -var-file=vars/your_env.tfvars
```

### 6. Deploy Static Assets To S3

Finally, you'll need to deploy the front-end static files and the API documentation to their appropriate buckets so that the CloudFront
distributions can serve them. There is a convenience script located in the `terraform/` directory that will sync the files with their
corresponding S3 buckets and invalidate the Cloudfront caches.

> :exclamation: Remember to build the platform first if it is not up to date! You likely already did this in the previous step!

When ready, run:

```bash
./deploy-files.sh
```
