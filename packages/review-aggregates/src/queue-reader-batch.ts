import { DeleteMessageBatchCommand, SQSClient } from '@aws-sdk/client-sqs';

import { bufferCount, concatMap, from, lastValueFrom } from 'rxjs';

import { AggregateIds } from './types';

export class QueueReaderBatch implements AggregateIds {
  constructor(
    private readonly client: SQSClient,
    private readonly queueUrl: string,
    private readonly messageIds: string[],
    readonly operatorIds: readonly string[],
    readonly diveSiteIds: readonly string[],
  ) {}

  private async dismissMessages(messageIds: string[]): Promise<string[]> {
    const cmd = new DeleteMessageBatchCommand({
      QueueUrl: this.queueUrl,
      Entries: messageIds.map((id) => ({ Id: id, ReceiptHandle: id })),
    });
    await this.client.send(cmd);
    return messageIds;
  }

  async finalize(): Promise<void> {
    await lastValueFrom(
      from(this.messageIds).pipe(
        bufferCount(10),
        concatMap(this.dismissMessages),
      ),
    );
  }
}
