import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class QueueService {
  private readonly log = new Logger(QueueService.name);

  constructor(
    @Inject(SQSClient)
    private readonly sqs: SQSClient,
  ) {}

  async addMessage(
    queueUrl: string,
    payload: string,
  ): Promise<string | undefined> {
    this.log.debug('Adding message to queue:', queueUrl, payload);
    try {
      const { MessageId } = await this.sqs.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: payload,
        }),
      );
      return MessageId;
    } catch (error) {
      this.log.error(error);
      return undefined;
    }
  }
}
