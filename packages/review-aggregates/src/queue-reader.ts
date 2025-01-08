import { SQSClient } from '@aws-sdk/client-sqs';

import { QueueReaderBatch } from './queue-reader-batch';

export class QueueReader {
  constructor(
    private readonly client: SQSClient,
    private readonly queueUrl: string,
  ) {}

  async readTasks(): Promise<QueueReaderBatch> {
    return new QueueReaderBatch();
  }
}
