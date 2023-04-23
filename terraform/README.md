# Terraform Deployment

Here are the steps needed to deploy a new environment. These steps need to be completed manually through the AWS console
or using the AWS APIs.

## Register the Domain Name and Generate a TLS Certificate

In AWS Route53 you'll need to register your domain name and create a new hosted zone.

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
