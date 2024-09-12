# Keep-Alive Function

This is just a very simple Lambda function that runs automatically as a CloudWatch cron job. It's job is to ping the home page
every few minutes to ensure that end-users never have to experience the dreaded cold-start delay.

The URL that will be pinged is determined by the value of the `BT_PING_URL` environment variable. This should be set to the
FQDN of the home page for the service. (E.g. `https://bottomti.me/`). The default value will be `http://localhost:4850`.
