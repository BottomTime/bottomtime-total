import { NotificationType } from '@bottomtime/api';
import { EmailQueueMessage, EmailType, EventKey } from '@bottomtime/common';

import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import dayjs from 'dayjs';
import { URL } from 'url';

import { Config } from '../config';
import {
  MembershipCanceledEvent,
  MembershipChangedEvent,
  MembershipCreatedEvent,
  MembershipInvoiceCreatedEvent,
  MembershipPaymentFailedEvent,
  MembershipTrialEndingEvent,
  UserCreatedEvent,
  UserPasswordResetRequestEvent,
  UserVerifyEmailRequestEvent,
} from '../events/event-types';
import { NotificationsService } from '../notifications';
import { User } from '../users';

type UserProfileInfo = EmailQueueMessage['options']['user'];

@Injectable()
export class EmailEventsHandler {
  private readonly log = new Logger(EmailEventsHandler.name);

  constructor(
    @Inject(SQSClient) private readonly sqs: SQSClient,
    @Inject(NotificationsService)
    private readonly notifications: NotificationsService,
  ) {}

  private getUserProfile(user: User): UserProfileInfo {
    return {
      email: user.email || '',
      profile: {
        name: user.profile.name || user.username,
      },
      username: user.username,
    };
  }

  private async queueEmail(
    user: User,
    eventKey: EventKey,
    message: EmailQueueMessage,
  ): Promise<void> {
    try {
      const isAuthorized = await this.notifications.isNotificationAuthorized(
        user,
        NotificationType.Email,
        eventKey,
      );
      if (!isAuthorized) return;

      await this.sqs.send(
        new SendMessageCommand({
          QueueUrl: Config.aws.sqs.emailQueueUrl,
          MessageBody: JSON.stringify(message),
        }),
      );
      this.log.verbose('Email message queued:', message);
    } catch (error) {
      this.log.error('Failed to queue email notification', error);
    }
  }

  @OnEvent(EventKey.MembershipCanceled)
  onMembershipCanceled(event: MembershipCanceledEvent) {
    if (!event.user.email) return;
    this.queueEmail(event.user, EventKey.MembershipCanceled, {
      to: { to: event.user.email },
      subject: 'Membership Canceled',
      options: {
        type: EmailType.MembershipCanceled,
        title: 'Membership Canceled',
        user: this.getUserProfile(event.user),
      },
    });
  }

  @OnEvent(EventKey.MembershipChanged)
  onMembershipChanged(event: MembershipChangedEvent) {
    if (!event.user.email) return;
    this.queueEmail(event.user, EventKey.MembershipChanged, {
      to: { to: event.user.email },
      subject: 'Membership Updated',
      options: {
        type: EmailType.MembershipChanged,
        title: 'Membership Updated',
        user: this.getUserProfile(event.user),
        newTier: event.newTierName,
        previousTier: event.previousTierName,
      },
    });
  }

  @OnEvent(EventKey.MembershipCreated)
  onMembershipCreated(event: MembershipCreatedEvent) {
    const title = 'Membership Activated!';
    if (!event.user.email) return;
    this.queueEmail(event.user, EventKey.MembershipCreated, {
      to: { to: event.user.email },
      subject: 'Membership activated',
      options: {
        type: EmailType.NewMembership,
        newTier: event.newTierName,
        title,
        user: this.getUserProfile(event.user),
      },
    });
  }

  @OnEvent(EventKey.MembershipInvoiceCreated)
  onMembershipInvoiceCreated(event: MembershipInvoiceCreatedEvent) {
    if (!event.user.email) return;

    const currency = Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: event.currency,
    });
    this.queueEmail(event.user, EventKey.MembershipInvoiceCreated, {
      to: { to: event.user.email, bcc: Config.adminEmail },
      subject: 'Latest invoice for Bottom Time membership',
      options: {
        type: EmailType.Invoice,
        title: 'Bottom Time Membership',
        subtitle: 'Your Latest Invoice',
        invoiceDate: dayjs(event.invoiceDate).format('LLL'),
        user: this.getUserProfile(event.user),
        currency: event.currency.toUpperCase(),
        downloadUrl: event.downloadUrl,
        items: event.items.map((line) => ({
          description: line.description || '',
          quantity: line.quantity ?? 1,
          unitPrice: currency.format(line.unitPrice),
          total: currency.format(line.total),
        })),
        amounts: {
          due: currency.format(event.amounts.due),
          paid: currency.format(event.amounts.paid),
          remaining: currency.format(event.amounts.remaining),
        },
        totals: {
          subtotal: currency.format(event.totals.subtotal),
          total: currency.format(event.totals.total),
          discounts: event.totals.discounts
            ? currency.format(event.totals.discounts)
            : undefined,
          taxes: event.totals.taxes
            ? currency.format(event.totals.taxes)
            : undefined,
        },
        period: event.period
          ? {
              start: dayjs(event.period.start).format('LL'),
              end: dayjs(event.period.end).format('LL'),
            }
          : undefined,
      },
    });
  }

  @OnEvent(EventKey.MembershipPaymentFailed)
  onMembershipPaymentFailed(event: MembershipPaymentFailedEvent) {
    if (!event.user.email) return;
    this.queueEmail(event.user, EventKey.MembershipPaymentFailed, {
      to: { to: event.user.email, cc: Config.adminEmail },
      subject: 'Important! Please update your payment info.',
      options: {
        type: EmailType.PaymentFailed,
        title: 'Payment Issue',
        subtitle: 'Your Attention is Required ⚠️',
        user: this.getUserProfile(event.user),
        paymentUrl: new URL(
          '/membership/confirmation',
          Config.baseUrl,
        ).toString(),
        paymentAmount: Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: event.currency,
        }).format(event.amountDue),
        paymentDue: dayjs(event.dueDate).format('LL'),
      },
    });
  }

  @OnEvent(EventKey.MembershipTrialEnding)
  onMembershipTrialEnding(event: MembershipTrialEndingEvent) {
    if (!event.user.email) return;
    this.queueEmail(event.user, EventKey.MembershipTrialEnding, {
      to: { to: event.user.email },
      subject: 'Your free trial of Bottom Time is ending soon...',
      options: {
        type: EmailType.TrialEnding,
        endDate: dayjs(event.endDate).format('LL'),
        title: 'Your Trial Period Is Ending Soon',
        user: this.getUserProfile(event.user),
      },
    });
  }

  onUserCreated(event: UserCreatedEvent) {
    if (!event.user.email) return;
    this.queueEmail(event.user, EventKey.UserCreated, {
      to: { to: event.user.email },
      subject: 'Welcome to Bottom Time',
      options: {
        type: EmailType.Welcome,
        title: 'Welcome to Bottom Time',
        subtitle: 'Get ready to dive in!',
        user: this.getUserProfile(event.user),
        logsUrl: new URL('/logbook', Config.baseUrl).toString(),
        profileUrl: new URL('/profile', Config.baseUrl).toString(),
        verifyEmailUrl: event.verificationUrl,
      },
    });
  }

  @OnEvent(EventKey.UserPasswordResetRequest)
  onUserPasswordResetRequest(event: UserPasswordResetRequestEvent) {
    if (!event.user.email) return;
    const title = 'Reset Your Password';
    this.queueEmail(event.user, EventKey.UserPasswordResetRequest, {
      to: { to: event.user.email },
      subject: title,
      options: {
        type: EmailType.ResetPassword,
        title,
        user: this.getUserProfile(event.user),
        resetPasswordUrl: event.resetUrl,
      },
    });
  }

  @OnEvent(EventKey.UserVerifyEmailRequest)
  onUserVerifyEmailRequest(event: UserVerifyEmailRequestEvent) {
    const title = 'Verify Your Email Address';
    if (!event.user.email) return;
    this.queueEmail(event.user, EventKey.UserVerifyEmailRequest, {
      to: { to: event.user.email },
      subject: title,
      options: {
        type: EmailType.VerifyEmail,
        title,
        user: this.getUserProfile(event.user),
        verifyEmailUrl: event.verificationUrl,
      },
    });
  }
}
