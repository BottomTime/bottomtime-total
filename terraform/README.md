# Terraform Deployment

Here are the steps needed to deploy a new environment. These steps need to be completed manually through the AWS console
or using the AWS APIs.

## Creating a New Terraformed Environment

### Ensure AWS Access

You will need to have the AWS CLI installed and it will have to be configured with access to an AWS account with sufficient privileges
to perform the deployment. (See below for necessary permissions.)

### Define Environment Secrets

For a new environment you will need to create a new secret in AWS Secrets Manager. It will need to be a key/value-pair secret with the following
values specified:

- `discordClientId` - Client ID for Discord OAuth.
- `discordClientSecret` - Client secret for Discord OAuth.
- `githubClientId` - Client ID for Github OAuth.
- `githubClientSecret` - Client secret for Github OAuth.
- `googleClientId` - Client ID for Google OAuth.
- `googleClientSecret` - Client secret for Google OAuth.
- `postgresUri` - The connection string needed to connect to the Postgres database.
- `sessionSecret` - A string used to encrypt the JWT authentication token. This should, ideally, be a long, randomly-generated string.
- `smtpHost` - Domain name of the SMTP server that will be used to send emails to users.
- `smtpPassword` - Password used to authenticate with the SMTP server.
- `smtpUsername` - Username used to authenticate with the SMTP server.

### Initialize Terraform State Provider

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

### Register the Domain Name and Generate a TLS Certificate

If you have not done so already, in AWS Route53 you'll need to register your domain name and create a new hosted zone.

Then, in AWS Certificate Manager you'll need to create a new TLS certificate to use for making HTTPS
requests to the site. The certificate should be scoped to `*.domainname` and `domainname`.

## Create an ECR Repository To Host The Docker Images

In AWS Elastic Container Registry, create a new registry called

```
<service_name>/<environment>/core
```

Where **&lt;service_name&gt;** is the configured short service name (this defaults to `bt`) and **&lt;environment&gt;** is the
specific environment for which the images will be hosted. (E.g. `dev`, `production`, etc.)

## Store Secrets in AWS Secrets Manager

Create a secret in AWS Secrets manager. It needs to be of type key/value pair and have the following values:

| Key              | Value                                                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `mongo_uri`      | The connection string needed to connect to the MongoDB database.                                                                        |
| `session_secret` | The secret string used to encrypt the contents of the session cookie. (This should be a long, randomly-generated string of characters.) |
| `smtp_password`  | The password needed to authenticate with the SMTP server for sending emails.                                                            |

## Provision a Serice Account

Terraform will need to run with adequate AWS credentials for deploying all parts of the infrastructure.
Create a user and assign these pre-defined roles:

- `AmazonEC2FullAccess`
- `AmazonEC2ContainerRegistryFullAccess`
- `AmazonECS_FullAccess`
- `AmazonRoute53FullAccess`
- `AmazonVPCFullAccess`
- `AWSCertificateManagerReadOnly`
- `CloudFrontFullAccess`
- `CloudWatchLogsFullAccess`
- `SecretsManagerReadWrite`

Additionally, attach the following inline policies:

### IAMManageRoles

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
        "iam:GetRole",
        "iam:ListRoleTags",
        "iam:ListAttachedRolePolicies",
        "iam:ListInstanceProfilesForRole",
        "iam:UpdateRoleDescription",
        "iam:DeletePolicy",
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:UpdateRole",
        "iam:PutRolePolicy",
        "iam:ListRolePolicies",
        "iam:GetRolePolicy"
      ],
      "Resource": ["*"]
    }
  ]
}
```

**NOTE:** This service account can (and should) be reused for deploying multiple environments, so skip this step if you already
have an environment deployed.

## Create a `.tfvars` File

In the `terraform/vars/` directory, copy the file called `sample.tfvars` to a new file called `<your_environment>.tfvars`.
Edit the variables in that file to configure your new environment.

| Variable                  |   Type   | Description                                                                                                                                       |      Required      |                  Default                  |
| ------------------------- | :------: | ------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------: | :---------------------------------------: |
| `admin_email`             | `string` | Email address for contacting the site admin. (This appears in a few spots on the site as well as email templates.)                                |                    |            `admin@bottomti.me`            |
| `availability_zone_count` | `number` | The number of availability zones to which the service should be deployed for geographical redundancy.                                             |                    |                    `2`                    |
| `certificate_domain`      | `string` | The domain name to which the TLS certificate in AWS ACM is registered. (This will be used to find the certificate at deploy time.)                |                    |              `*.bottomti.me`              |
| `docs_domain`             | `string` | The domain in the hosted zone at which the API documentation should be hosted.                                                                    |                    |                  `devs`                   |
| `hosted_zone`             | `string` | The domain name of the hosted zone at which the service will respond to requests.                                                                 |                    |               `bottomti.me`               |
| `image_tag`               | `string` | The Docker image tag to pull when deploying the backend service.                                                                                  |                    |                 `latest`                  |
| `log_level`               | `string` | The level of verbosity at which log messages will be written to the event log. Must be one of `trace`, `debug`, `info`, `warn`, `error`, `fatal`. |                    |                  `info`                   |
| `secret_id`               | `string` | The ID of the AWS Secrets Manager secret that holds all of the sensitive config values for the application. (See above.)                          | :white_check_mark: |                                           |
| `service_domain`          | `string` | The domain in the hosted zone at which the backend service should be available.                                                                   |                    |                   `api`                   |
| `service_name`            | `string` | Name of the service as it should appear in AWS tags.                                                                                              |                    |               `Bottom Time`               |
| `service_name_short`      | `string` | A shorter version of the service name that is safe to use in resource names and identifiers in AWS.                                               |                    |                   `bt`                    |
| `site_domain`             | `string` | The domain in the hosted zone at which the web frontend should be available.                                                                      |                    |                   `www`                   |
| `smtp_from`               | `string` | The email address to use in the 'reply to' field when sending emails.                                                                             |                    | `"Bottom Time Admin" <admin@bottomti.me>` |
| `smtp_host`               | `string` | The hostname of the SMTP server that will be used to send emails.                                                                                 | :white_check_mark: |                                           |
| `smtp_port`               | `number` | The port number on which to connect to the SMTP host when sending emails.                                                                         |                    |                   `465`                   |
| `smtp_reply_to`           | `string` | The email address to use in the 'reply to' field when sending emails.                                                                             |                    |         `donotreply@bottomti.me`          |
| `smtp_username`           | `string` | The username to use when logging into the SMTP server to send emails.                                                                             | :white_check_mark: |                                           |
