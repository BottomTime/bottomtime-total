# Review Rating Aggregator

This Lambda function can be run periodically to recalculate average ratings for dive sties and dive operators.
It works by pulling messages from an SQS queue to determine which dive sites or operators have had reviews
added, deleted, or changed recently. It will pull 200 messages at a time, de-duplicate the IDs for the sites and
operators, and then recalculate their average ratings.

The SQS message body must be a serialized JSON string matching the following type:

```typescript
type RatingUpdatedMessage = {
  entity: 'dvieSite' | 'operator';
  id: string;
};
```

Because we are running in a Lambda function, this operation is timeboxed to running for only 10 minutes at a time. If
more messages remain in the queue, then the function will need to be invoked again.

## Configuration

The following environment variables are recognized for configuration.

| Variable                       | Description                                                                                                                           | Default Value                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `BT_LOG_LEVEL`                 | The level of verbosity at which log messages should be written. Must be one of `trace`, `debug`, `info`, `warn`, `error`, or `fatal`. | `info`                                                              |
| `BT_POSTGRES_URI`              | The URI at which the Postgres database can be accessed.                                                                               | `postgresql://bt_user:bt_admin1234@localhost:5432/bottomtime_local` |
| `BT_POSTGRES_REQUIRE_SSL`      | Whether to require SSL when connecting to the database.                                                                               | `false`                                                             |
| `BT_AWS_SQS_REVIEWS_QUEUE_URL` | The URL to the AWS SQS queue from which messages should be read.                                                                      | `http://localstack:4566/000000000000/reviews`                       |
