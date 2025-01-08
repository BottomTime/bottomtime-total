import { Message, ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

import { filter, from, lastValueFrom, map, tap, toArray } from 'rxjs';
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
    const messageIds = await lastValueFrom(
      from(this.retrieveMessages()).pipe(
        filter((msg) => !!msg.MessageId),
        tap((msg) => {
          const parsed = ReviewQueueMessage.safeParse(msg.Body);
          if (parsed.success) {
            if (parsed.data.entity === 'diveSite') {
              diveSiteIds.add(parsed.data.id);
            }

            if (parsed.data.entity === 'operator') {
              logEntryIds.add(parsed.data.id);
            }
          }
        }),
        map((msg) => msg.MessageId!),
        toArray(),
      ),
    );

    return new QueueReaderBatch(
      this.client,
      this.queueUrl,
      messageIds,
      Array.from(logEntryIds),
      Array.from(diveSiteIds),
    );
  }
}
