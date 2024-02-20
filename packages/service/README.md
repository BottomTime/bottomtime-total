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

### Enabling OAuth Authentication

TODO

### Sending and Receiving Emails

In order to transmit email messages, the platform needs to be configured to talk to an SMTP host. This external host will
be responsible for relaying emails to their destination.

See the section on [Configuration](#configuration) below for details on how to configure the platform to access your SMTP host.
The relevant environment variables you will need to set are

- `BT_SMTP_FROM`
- `BT_SMTP_HOST`
- `BT_SMTP_PASSWORD`
- `BT_SMTP_PORT`
- `BT_SMTP_REPLY_TO`
- `BT_SMTP_USERNAME`

For local development it is recommended to use something simple like Amazon's [Simple Email Service](https://us-east-1.console.aws.amazon.com/ses/home?region=us-east-1#/homepage) (SES).

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

## Configuration

Environment variables can be defined in your shell or the environment itself, however, in development it may be easier to
define them in a `.env` file located in this directory. To get started, you can copy the `.env.example` file and then modify
the values you need.

These are the environment variables used to configure the application.

| Variable                  | Description                                                                                                                                                                                                     |                Default Value                 |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------: |
| `AWS_ACCESS_KEY_ID`       | The AWS access key for authenticating with AWS services. The key must be linked to an account with sufficient permission to perform all operations required by the platform. (See Initial setup section above.) |                                              |
| `AWS_SECRET_ACCESS_KEY`   | The AWS secret access key that pairs with the AWS access key.                                                                                                                                                   |                                              |
| `AWS_REGION`              | The AWS region in which the service is operating. All AWS resources used by the platform will be accessed from this region.                                                                                     |                 `us-east-1`                  |
| `BT_AWS_MEDIA_BUCKET`     | The name of the AWS S3 bucket to which media files will be saved and retrieved from.                                                                                                                            |           `bottomtime-media-local`           |
| `BT_LOG_LEVEL`            | The level of detail at which log data will be written to the event log. Must be one of `trace`, `debug`, `info`, `warn`, `error`, or `fatal`.                                                                   |                    `info`                    |
| `BT_MONGO_URI`            | The MongoDB connection string needed to access the MongoDB database.                                                                                                                                            | `mongodb://127.0.0.1:27017/bottomtime-local` |
| `BT_PASSWORD_SALT_ROUNDS` | The number of rounds to use when hashing/salting passwords using the bcrypt algorithm. This number may need to be increased periodically as hardware gets faster to ensure passwords remain hard to crack.      |                     `15`                     |
| `BT_PORT`                 | The TCP port number on which the service will listen for requests. This should only set when testing locally. When running the service in a Docker conatier, only the default port (4800) will work.            |                    `4800`                    |
| `BT_SMTP_FROM`            | The email address that will be provided in the "from" field when emails are sent by the platform.                                                                                                               |  `"Bottom Time Admin" <admin@bottomti.me>`   |
| `BT_SMTP_HOST`            | The hostname of the SMTP server that will handle the transmission of emails for the platform.                                                                                                                   |     `email-smtp.us-east-1.amazonaws.com`     |
| `BT_SMTP_PASSWORD`        | The password to use when authenticating with the SMTP host.                                                                                                                                                     |                                              |
| `BT_SMTP_PORT`            | The port number on which to connect to the SMTP host.                                                                                                                                                           |                    `465`                     |
| `BT_SMTP_REPLY_TO`        | The email address that will be provided in the "reply to" field when emails are sent by the platform.                                                                                                           |                                              |
| `BT_SMTP_USERNAME`        | The username to use when authenticating with the SMTP host.                                                                                                                                                     |                                              |
| `NODE_ENV`                | The environment in which the application is running. Setting this to `production` will have implications on how the application is built and runs.                                                              |                   `local`                    |

## Admin CLI

The included Admin CLI is useful for running one-off tasks like seeding the database or generating an auth token for a user.
For the full list of commands, run

```bash
yarn admin --help
```
