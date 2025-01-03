import { EventKey } from '@bottomtime/common';

import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { EventData } from '../events';

type ReviewsQueueMessage = {
  entity: 'diveSite' | 'operator';
  id: string;
};

@Injectable()
export class ReviewEventsHandler {
  private readonly log = new Logger(ReviewEventsHandler.name);

  constructor(@Inject(SQSClient) private readonly sqs: SQSClient) {}

  @OnEvent(EventKey.DiveSiteReviewAdded)
  @OnEvent(EventKey.DiveSiteReviewModified)
  @OnEvent(EventKey.DiveSiteReviewDeleted)
  @OnEvent(EventKey.OperatorReviewAdded)
  @OnEvent(EventKey.OperatorReviewModified)
  @OnEvent(EventKey.OperatorReviewDeleted)
  async handleReviewEvent(event: EventData): Promise<void> {
    let message: ReviewsQueueMessage;

    switch (event.key) {
      case EventKey.DiveSiteReviewAdded:
      case EventKey.DiveSiteReviewModified:
      case EventKey.DiveSiteReviewDeleted:
        message = {
          entity: 'diveSite',
          id: event.diveSite.id,
        };
        break;

      case EventKey.OperatorReviewAdded:
      case EventKey.OperatorReviewModified:
      case EventKey.OperatorReviewDeleted:
        message = {
          entity: 'operator',
          id: event.operator.id,
        };
        break;

      default:
        return;
    }

    try {
      await this.sqs.send(
        new SendMessageCommand({
          QueueUrl: '', // TODO: This needs to be configurable.
          MessageBody: JSON.stringify(message),
        }),
      );
    } catch (error) {
      this.log.error(error);
    }
  }
}
