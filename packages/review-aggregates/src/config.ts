/* eslint-disable no-process-env */
export class Config {
  static get postgresUri(): string {
    return (
      process.env.BT_POSTGRES_URI ||
      'postgresql://bt_user:bt_admin1234@localhost:5432/bottomtime_local'
    );
  }

  static get postgresRequireSsl(): boolean {
    return /^(true|1)$/i.test(process.env.BT_POSTGRES_REQUIRE_SSL ?? '');
  }

  static get sqsQueueUrl(): string {
    return process.env.BT_SQS_QUEUE_URL || '';
  }
}
