import { EmailQueueMessage, EmailType } from '@bottomtime/common';

import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { Config } from '../config';
import { EventKey } from './event-key';
import { MembershipCancelledEvent, MembershipChangedEvent } from './membership';

@Injectable()
export class EmailNotificationsHandler {
  private readonly log = new Logger(EmailNotificationsHandler.name);

  constructor(@Inject(SQSClient) private readonly sqs: SQSClient) {}

  private queueEmail(message: EmailQueueMessage) {
    this.sqs
      .send(
        new SendMessageCommand({
          QueueUrl: Config.aws.sqs.emailQueueUrl,
          MessageBody: JSON.stringify(message),
        }),
      )
      .then(() => {
        this.log.verbose('Email message queued:', message);
      })
      .catch((error) => {
        this.log.error('Failed to queue email notification', error);
      });
  }

  @OnEvent(EventKey.MembershipCanceled)
  onMembershipCanceled(event: MembershipCancelledEvent) {
    if (!event.user.email) return;

    this.queueEmail({
      to: { to: event.user.email },
      subject: 'Membership Canceled',
      options: {
        type: EmailType.MembershipCanceled,
        title: 'Membership Canceled',
        user: {
          username: event.user.username,
          email: event.user.email,
          profile: {
            name: event.user.profile.name || event.user.username,
          },
        },
      },
    });
  }

  @OnEvent(EventKey.MembershipChanged)
  onMembershipChanged(event: MembershipChangedEvent) {
    if (!event.user.email) return;

    this.queueEmail({
      to: { to: event.user.email },
      subject: 'Membership Updated',
      options: {
        type: EmailType.MembershipChanged,
        title: 'Membership Updated',
        user: {
          email: event.user.email,
          profile: {
            name: event.user.profile.name || event.user.username,
          },
          username: event.user.username,
        },
        newTier: event.newTierName,
        previousTier: event.previousTierName,
      },
    });
  }
}
