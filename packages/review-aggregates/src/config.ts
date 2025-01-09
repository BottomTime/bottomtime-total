/* eslint-disable no-process-env */
import { z } from 'zod';

const LogLevel = z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']);
type LogLevel = z.infer<typeof LogLevel>;

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
    return (
      process.env.BT_SQS_QUEUE_URL ||
      'http://localstack:4566/000000000000/reviews'
    );
  }

  static get logLevel(): LogLevel {
    const parsed = LogLevel.safeParse(process.env.BT_LOG_LEVEL);
    return parsed.success ? parsed.data : 'info';
  }
}
