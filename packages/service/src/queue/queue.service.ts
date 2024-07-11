import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Injectable } from '@nestjs/common';

import { v4 as uuid } from 'uuid';

@Injectable()
export class QueueService {
  constructor(private readonly sqs: SQSClient) {}

  async addMessage(queueUrl: string, payload: string): Promise<string> {
    const { MessageId } = await this.sqs.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: payload,
        MessageDeduplicationId: uuid(),
      }),
    );
    return MessageId || '';
  }
}
