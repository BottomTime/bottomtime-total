import { Message, ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

import Logger from 'bunyan';
import { filter, from, lastValueFrom, tap, toArray } from 'rxjs';
import { z } from 'zod';

import { QueueReaderBatch } from './queue-reader-batch';

const ReviewQueueMessage = z.object({
  entity: z.enum(['diveSite', 'operator']),
  id: z.string().uuid(),
});
type ReviewQueueMessage = z.infer<typeof ReviewQueueMessage>;

export class QueueReader {
  private static readonly MaxMessages = 200;

  constructor(
    private readonly client: SQSClient,
    private readonly log: Logger,
    private readonly queueUrl: string,
  ) {}

  private async *retrieveMessages(): AsyncGenerator<Message> {
    let hasMessages = false;
    let messages = 0;

    do {
      const cmd = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 300,
      });

      const result = await this.client.send(cmd);

      if (!result.Messages || result.Messages.length === 0) break;
      hasMessages = result.Messages.length > 0;

      for (const message of result.Messages) yield message;
      messages += result.Messages.length;
    } while (hasMessages && messages < QueueReader.MaxMessages);
  }

  async getBatch(): Promise<QueueReaderBatch> {
    const logEntryIds = new Set<string>();
    const diveSiteIds = new Set<string>();
    const messages = await lastValueFrom(
      from(this.retrieveMessages()).pipe(
        filter((msg) => !!msg.MessageId),
        tap((msg) => {
          try {
            const json = JSON.parse(msg.Body ?? '{}');
            const data = ReviewQueueMessage.parse(json);
            if (data.entity === 'diveSite') {
              diveSiteIds.add(data.id);
            }

            if (data.entity === 'operator') {
              logEntryIds.add(data.id);
            }
          } catch (error) {
            this.log.warn(
              `Failed to parse JSON from SQS message with ID "${msg.MessageId}":`,
              error,
            );
          }
        }),
        toArray(),
      ),
    );

    return new QueueReaderBatch(
      this.client,
      this.queueUrl,
      this.log,
      messages,
      Array.from(logEntryIds),
      Array.from(diveSiteIds),
    );
  }
}
