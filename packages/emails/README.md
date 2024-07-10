# Email Service

This service exists to send emails on demand based on pre-defined templates.

- [Maizzle](https://maizzle.com/) is used to curate and maintain the HTML email templates.
- [Nodemailer](https://www.nodemailer.com/) is used to transmit the email using SMTP.

The service is built as an AWS Lambda function that can be run in a serverless environment.

## Managing HTML Templates

Templates can be found in the `src/templates/` folder. Configuration for Maizzle can be found in the `config.js` and
`config.production.js` files. Other resources associated with the templates can be found under `src/` (e.g. layouts, CSS
files, etc.)

To build the templates run

```bash
yarn build:templates
```

or simply

```bash
yarn build
```

The latter command will build both the templates and the email service itself.

> **NOTE:** You will need to build the templates before running the Jest tests for the service since compiled
> templates will need to exist in order for the tests to pass.

If you plan on modifying the templates or creating new ones you can run

```bash
yarn dev
```

This will allow you to preview the templates in your browser at [http://localhost:3000/](http://localhost:3000/)
with hot reloading enabled.

## Service Configuration

The following environment variables are used to configure the Email Service.

| Variable           | Description                                                                                                                                                            |   Type   |      Required      | Default                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: | :----------------: | ----------------------------------------- |
| `BT_ADMIN_EMAIL`   | The email address at which site admins can be contacted. This address may be included in emails or rendered content.                                                   | `string` |                    | `admin@bottomti.me`                       |
| `BT_BASE_URL`      | Base URL at which the site will respond to requests. This may be included in emails or rendered content.                                                               | `string` |                    | `http://localhost:4850`                   |
| `BT_LOG_LEVEL`     | The level of verbosity at which log events will be written. Allowed options (from least to most verbose) are `fatal`, `error`, `warn`, `info`, `debug`, and `verbose`. |  `enum`  |                    | `info`                                    |
| `BT_SMTP_FROM`     | Default email address to use in the "from" field when the application sends an email.                                                                                  | `string` |                    | `"Bottom Time Admin" <admin@bottomti.me>` |
| `BT_SMTP_HOST`     | Hostname of the SMTP server that will handle email transmission.                                                                                                       | `string` |                    | `email-smtp.us-east-1.amazonaws.com`      |
| `BT_SMTP_PASSWORD` | The password for authenticating with the SMTP host.                                                                                                                    | `string` | :white_check_mark: |                                           |
| `BT_SMTP_PORT`     | Port number on which to connect to the SMTP host.                                                                                                                      | `number` |                    | `465`                                     |
| `BT_SMTP_REPLY_TO` | Default reply-to address to include in emails sent by the application.                                                                                                 | `string` |                    | `donotreply@bottomti.me`                  |
| `BT_SMTP_USERNAME` | Username for authenticating with the SMTP host.                                                                                                                        | `string` | :white_check_mark: |                                           |
| `NODE_ENV`         | Indicates the environment in which the service is running. A value of `production` will have certain implications for security and performance.                        | `string` |                    | `local`                                   |

## Working With the Service

The source code for the service itself can be found at `src/service/`. To compile the service run

```bash
yarn build
```

To run the Jest unit tests run

```bash
yarn test
```
