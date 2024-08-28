# Bottom Time Backend Service

## Initial Setup

If you are planning on running the backend service locally you'll first need to perform the following setup tasks in order
to have everything working as expected.

### Storage

File storage is handled by AWS S3. For local development and testing, you will need an S3 bucket to act as the platform's media
storage bucket as well as an AWS key and secret key pair with the following permissions on the bucket:

- `s3:getObject`
- `s3:deleteObject`
- `s3:listBucket`
- `s3:...`

See the section on [Configuration](#configuration) below for details on how to configure the platform to access your bucket.
The relevant environment variables you will need to set are

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `BT_AWS_MEDIA_BUCKET`

### Using S3 Locally

If you are developing locally using Docker Compose you will be using a local version of AWS S3 running in a container. Before you will
be able to save or retrieve files from the container you will need to create an S3 bucket. Running this commmand will do that for you:

```bash
aws s3api create-bucket --endpoint-url http://localhost:4569 --bucket bottomtime-media-local
```

If you are not using the default bucket name (`bottomtime-media-local`), then you will need to change it accordingly in the command.

**NOTE:** The S3 container saves files in a mounted volume so they will persist when you restart the Docker container. You can inspect
the files at `<repositoryRoot>/.s3/`.

### Enabling OAuth Authentication

To enable OAuth authentication you will need to do some setup with the target providers. (E.g. Google, Facebook,
Discord, etc.)

#### 1) Configure OAuth Provider

> **NOTE:** If the OAuth provider you are looking to work with has already been configured for you and you have
> the OAuth Client ID and Client Secret pair then you can skip ahead to the next step.

Each provider is different and will have a slightly different setup experience but the OAuth standard works the
same everywhere so the same checklist of setup steps should be followed.

- [x] Create an account with the provider (if you don't already have one) and access the developer console/dashboard.
- [x] Enable OAuth authentication and generate Client ID and Client Secret. Make note of these for later but keep them safe!
      **DO NOT** check them into Github or put them anywhere where they are publicly accessible.
- [x] Configure authorized callback URLs. You will need one for each environment that will authenticate with the provider.
      These URLs will take the form of `<base_url>/api/auth/<provider_key>/callback` where
  - `<base_url>` is the base URL for the environment (e.g. `https://staging.bottomti.me/`) and
  - `<provider_key>` is a string that identifies the provider (e.g. `google` or `discord`).
- [x] Perform any additional configuration permitted by the provider (branding, customizing the login page, etc.)

#### 2) Configure the Service

Now that things are setup on the provider-side, all you need to do is configure our backend service with the
client ID/secret pair from before. To do this you only need to set the related environment variables. E.g. for
Google you would set `BT_GOOGLE_CLIENT_ID` and `BT_GOOGLE_CLIENT_SECRET`.

See the [Configuration](#configuration) section below for the full list of environment variables.

### Setting Up Stripe to Handle Membership Subscriptions

#### 1) Setup Account and Get API Keys

If you plan on doing development or testing with accounts with paid tiers then you'll need to configure the service to
access [Stripe](https://stripe.com) to manage subscriptions.

First, you will need access to a Stripe account. Once it is created you will need both the secret key (for use here in the backend service) and the publishable key (for use in front-end services).

Set the `BT_STRIPE_SDK_KEY` environment variable to the value of the secret key in your environment. For local development
you can update your `.env` file.

Update your front-end environments' configuration with the publishable API key.
(See the Configuration sections of the relevant README.md files).

#### 2) Provision Products and Features

If you are using an existing Stripe account with the products, prices, and features already provisioned then you
can skip ahead. Otherwise, you'll need to provision these elements yourself.

Once you have ensured that your `BT_STRIPE_SDK_KEY` environment variable is set correctly you can run:

```bash
yarn admin stripe init-products
```

#### 3) Setup Webhooks

If you are setting up a new Stripe account you will need to enable the
[Stripe Workbench](https://dashboard.stripe.com/workbench/overview) for developers. On the Webhooks tab you will need
to create a new endpoint with the URL `https://<base_url>/api/stripe`. Where `<base_url>` is the base URL for the service.

You can use the admin tool to quickly provision this. Run this command:

```bash
yarn admin stripe webhooks <endpoint_url>
```

Alternatively, you can provision the manually using Stripe's dashboard. The events that should be forwarded to the
webhook are listed here:

- `customer.subscription.deleted`
- `customer.subscription.paused`
- `customer.subscription.resumed`
- `entitlements.active_entitlement_summary.updated`
- `invoice.created`
- `invoice.finalization_failed`
- `invoice.finalized`
- `invoice.paid`
- `invoice.payment_action_required`
- `invoice.payment_failed`
- `invoice.upcoming`
- `invoice.updated`

If successful, the command will output something like this:

```
Provisioning webhook endpoint for https://staging.bottomti.me/api/stripe ...
New webhook endpoint created at:
https://staging.bottomti.me/api/stripe

Signing secret:
whsec_Fh3vP5vq4RuiP2ugsNlIcumSaOjAtx7L
```

Once the endpoint is provisioned you need to configure the service to use the signing secret when receiving webhook
requests. Take the Signing Secret generated by the previous command (or find it in Stripe's Workbench under the Webhooks
tab) and then set the `BT_STRIPE_WEBHOOK_SECRET` environment variable.

## Development

### Yarn commands

The following Yarn commands are commonly used for working with the backend service.

#### Compiling the Code

To compile the backend run. Note that this simply compiles the typescript and does not generate any artifacts. This can
be used to see if the code actually compiles. When running `tsx` is used to run the Typescript directly.

```bash
yarn build
```

#### Regenerating the API Docs

To regenerate the API docs run,

```bash
yarn docs
```

For more on how the API docs work, see the section below.

#### Running the Development Server

To start the development server, run

```bash
yarn serve
```

By default, the server will listen for requests on port `4800`. The server is hosted by [Nodemon](https://nodemon.io/) and
will monitor the source files for changes and automatically restart the server when changes are detected.

#### Running the Test Suite

To run the Jest tests for the backend service you can run

```bash
yarn test
```

## Admin CLI

The included Admin CLI is useful for running one-off tasks like seeding the database or generating an auth token for a user.
For the full list of commands, run

```bash
yarn admin --help
```

The sub-commands also have their own documentation. For example:

```bash
yarn admin db --help
```

## Testing APIs Using Postman

[Postman](https://www.postman.com/) is a very handy tool for doing API development and testing.

TODO

## Configuration

Environment variables can be defined in your shell or the environment itself, however, in development it may be easier to
define them in a `.env` file located in this directory. To get started, you can copy the `.env.example` file and then modify
the values you need.

Here is the comprehensive list of environment variables used by the service.

| Variable                     | Description                                                                                                                                                                                               |   Type    |      Required      | Default                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------: | :----------------: | ------------------------------------------------------------------- |
| `AWS_ACCESS_KEY_ID`          | Access key for calling AWS APIs. The key must correspond to an account with sufficient privileges. See above.                                                                                             | `string`  | :white_check_mark: |                                                                     |
| `AWS_REGION`                 | Indicates which AWS region the service will be operating in.                                                                                                                                              | `string`  |                    | `us-east-1`                                                         |
| `AWS_SECRET_ACCESS_KEY`      | Secret key for calling AWS APIs.                                                                                                                                                                          | `string`  | :white_check_mark: |                                                                     |
| `BT_ADMIN_EMAIL`             | The email address at which site admins can be contacted. This address may be included in emails or rendered content.                                                                                      | `string`  |                    | `admin@bottomti.me`                                                 |
| `BT_AWS_MEDIA_BUCKET`        | The name of the S3 bucket in which user-generated media (images, videos, etc.) will be stored.                                                                                                            | `string`  |                    | `bottomtime-media-local`                                            |
| `BT_AWS_S3_ENDPOINT`         | Optional. An endpoint URL for accessing AWS S3. This is useful for local testing against a mock S3 service. For production this should not be set. By default, the official AWS S3 endpoint will be used. | `string`  |                    |                                                                     |
| `BT_AWS_SQS_EMAIL_QUEUE_URL` | The URL at which the AWS SQS queue for sending emails can be reached.                                                                                                                                     | `string`  | :white_check_mark: |                                                                     |
| `BT_BASE_URL`                | Base URL at which the site will respond to requests. This may be included in emails or rendered content.                                                                                                  | `string`  |                    | `http://localhost:4850`                                             |
| `BT_CONFIGCAT_SDK_KEY`       | SDK key for accessing [ConfigCat](https://app.configcat.com/) feature flag settings.                                                                                                                      | `string`  | :white_check_mark: |                                                                     |
| `BT_FAST_IMAGE_RESIZE`       | A flag to enable fast image resizing. By default a higher-quality algorithm will be used. Enabling this will switch to a faster, lower-fidelity algorith which is useful for speeding up tests.           | `boolean` |                    | `false`                                                             |
| `BT_FRIENDS_LIMIT`           | This option sets a hard limit on the number of friends a user can have associated with their account. Maximum is 5000 and the default is 1000.                                                            | `number`  |                    | `1000`                                                              |
| `BT_GITHUB_CLIENT_ID`        | The application client ID for performing OAuth 2.0 authentication with Github.                                                                                                                            | `string`  |                    |                                                                     |
| `BT_GITHUB_CLIENT_SECRET`    | The application client secret for performing OAuth 2.0 authentication with Github.                                                                                                                        | `string`  |                    |                                                                     |
| `BT_GOOGLE_CLIENT_ID`        | The application client ID for performing OAuth 2.0 authentication with Google.                                                                                                                            | `string`  |                    |                                                                     |
| `BT_GOOGLE_CLIENT_SECRET`    | The application client secret for performing OAuth 2.0 authentication with Google.                                                                                                                        | `string`  |                    |                                                                     |
| `BT_LOG_LEVEL`               | The level of verbosity at which log events will be written. Allowed options (from least to most verbose) are `fatal`, `error`, `warn`, `info`, `debug`, and `verbose`.                                    |  `enum`   |                    | `info`                                                              |
| `BT_PASSWORD_SALT_ROUNDS`    | Number of rounds to use when calculating a bcrypt salted hash on a password. The time it takes to hash a password will go up exponentially with this value.                                               | `number`  |                    | `15`                                                                |
| `BT_PORT`                    | Port number on which the service will listen for requests                                                                                                                                                 | `number`  |                    | `4800`                                                              |
| `BT_POSTGRES_REQUIRE_SSL`    | Indicates whether the Postgres connection requires SSL to be enabled.                                                                                                                                     | `boolean` |                    | `false`                                                             |
| `BT_POSTGRES_URI`            | Connection string for accessing the Postgres database.                                                                                                                                                    | `string`  |                    | `postgresql://bt_user:bt_admin1234@localhost:5432/bottomtime_local` |
| `BT_SESSION_COOKIE_DOMAIN`   | The domain to which the application's session cookie should be scoped.                                                                                                                                    | `string`  |                    | `localhost`                                                         |
| `BT_SESSION_COOKIE_TTL`      | The time-to-live duration for newly-issued session cookies. After this time is elapsed, the cookie will expire and the session will need to be re-authenticated. The time is in milliseconds.             | `number`  |                    | `1209600000` (Two weeks)                                            |
| `BT_SESSION_COOKIE_NAME`     | The name to be given to the application's session cookie when setting it in the browser.                                                                                                                  | `string`  |                    | `bottomtime.local`                                                  |
| `BT_SESSION_SECRET`          | The secret string to use when signing JWT tokens for users. This should be a long, random, hard-to-guess string.                                                                                          | `string`  |                    | `va20e0egr0aA/x2UFmckWDy1MYxoaZTaA2M4LGFli5k=`                      |
| `BT_SESSION_SECURE_COOKIE`   | Indicates whether the session cookie should be secure. If true, the cookie will only work over HTTPS connetions. If false, the cookie will work over HTTP or HTTPS.                                       | `boolean` |                    | `false`                                                             |
| `BT_STRIPE_SDK_KEY`          | The secret key needed to access Stripe APIs to process payments.                                                                                                                                          | `string`  | :white_check_mark: |                                                                     |
| `BT_STRIPE_WEBHOOK_SECRET`   | The signing secret for receiving webhook POST events from Stripe. (Can be retrieved from Stripe Workbench.)                                                                                               | `string`  | :white_check_mark: |                                                                     |
| `NODE_ENV`                   | Indicates the environment in which the service is running. A value of `production` will have certain implications for security and performance.                                                           | `string`  |                    | `local`                                                             |

## API Documentation

API documentation is written inline alongside the code. It is found mostly in the controllers (`*.controller.ts` files) and dedicated documentation
files (`*.docs.ts`). There is also a `swaggerDefinition.cjs` file in the root of the backend service package.

The standard used is the [Swagger (OpenAPI)](https://swagger.io/docs/specification/about/) standard. See the documentation for specifications and
how-tos. As stated above, compiling the documentation can be done by running `yarn docs` in your terminal. Documentation is compiled to `public/docs/`,
specifically, the `swagger.json` file is written whenever you compile the documentation.

If you are running the platform locally using Docker Compose, then the documentation is hosted in a Docker container behind an nginx reverse proxy.
You can view the documentation at [http://localhost:4890/](http://localhost:4890/). If you are running Docker Compose in watch mode
(`docker compose watch`) then the Docker image will be updated automatically whenever you compile the documentation.

> **NOTE:** Sorry, there is no hot-reloading at this time! You will need to refresh the browser page to view the changes.

> **NOTE:** The swagger-jsdoc Comment Formatter VS Code extension is _highly_ recommended for editing the API documenation.

```

```
