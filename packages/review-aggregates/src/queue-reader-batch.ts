import {
  DeleteMessageBatchCommand,
  Message,
  SQSClient,
} from '@aws-sdk/client-sqs';

import Logger from 'bunyan';
import { bufferCount, concatMap, from, lastValueFrom } from 'rxjs';

import { AggregateIds } from './types';

export class QueueReaderBatch implements AggregateIds {
  constructor(
    private readonly client: SQSClient,
    private readonly queueUrl: string,
    private readonly log: Logger,
    private readonly messages: Message[],
    readonly operatorIds: readonly string[],
    readonly diveSiteIds: readonly string[],
  ) {}

  private async dismissMessages(messages: Message[]): Promise<Message[]> {
    if (messages.length === 0) return messages;

    this.log.debug(`Deleting ${messages.length} messages...`);

    const cmd = new DeleteMessageBatchCommand({
      QueueUrl: this.queueUrl,
      Entries: messages.map((msg) => ({
        Id: msg.MessageId,
        ReceiptHandle: msg.ReceiptHandle,
      })),
    });
    await this.client.send(cmd);
    return messages;
  }

  get hasEntries(): boolean {
    return this.messages.length > 0;
  }

  async finalize(): Promise<void> {
    if (!this.hasEntries) return;
    await lastValueFrom(
      from(this.messages).pipe(
        bufferCount(10),
        concatMap(this.dismissMessages.bind(this)),
      ),
    );
  }
}
