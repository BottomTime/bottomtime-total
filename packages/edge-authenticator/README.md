# Bottom Time Edge Authentication

This package is a small utility that can be deployed to AWS Lambda to authenticate authorized users of protected environments. It will
issue the necessary JWT for accessing those environments.

## Configuration

The app requires a number of environment variables to be set in order to work correctly. For testing locally, a `.env` file can be created to test
different configurations. (Though, the default config should work fine for testing locally.)

| Variable                       | Description                                                                  | Default                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `AWS_REGION`                   | Required to indicate the AWS region in which the Cognito user pool exists.   | `us-east-1`                                                                              |
| `BT_EDGE_BASE_URL`             | Base URL at which the authenticator app should respond to requests.          | `http://localhost:9000/`                                                                 |
| `BT_EDGE_COOKIE_DOMAIN`        | Domain to which the issued session cookies should be scoped.                 | `localhost`                                                                              |
| `BT_EDGE_COOKIE_NAME`          | The name to assign to the session cookie when it is issued.                  | `bottomtime.auth`                                                                        |
| `BT_EDGE_COOKIE_TTL_SECONDS`   | Time (in seconds) that the session cookie (and JWT token will be good for).  | `604800` (One week)                                                                      |
| `BT_EDGE_DYNAMODB_USERS_TABLE` | Name of the DynamoDb table where the list of authorized users is maintained. | `bt-authorized-devs`                                                                     |
| `BT_EDGE_GOOGLE_CLIENT_ID`     | Google OAuth2.0 client ID for authenticating users.                          |                                                                                          |
| `BT_EDGE_GOOGLE_CLIENT_SECRET` | Google OAuth2.0 client secret for authenticating users.                      |                                                                                          |
| `BT_LOG_LEVEL`                 | Level of detail at which log entries should be written.                      | `info`                                                                                   |
| `BT_EDGE_SESSION_SECRET`       | A long, random, hard-to-guess string used to sign the issued JWTs            | `nxS0JJ04kNjiZpJxQz5iq6OFoN6bAvsQxO2eVLGaSQyslZU8ltxqYlmKUIon9B8scg89VBg3eFZAs6umkWUYWQ` |

## Development

The following commands can be used to work with the authenticator app.

### Rebuild the App

```bash
yarn build
```

### Run App Locally

```bash
yarn dev
```

Once running, the app will be accessible at [http://localhost:9000](http://localhost:9000).

### Run Unit Tests

Unit tests can be found the `tests/` directory. To run them simply run

```bash
yarn test
```
