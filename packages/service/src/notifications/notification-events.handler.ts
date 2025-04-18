import {
  CreateOrUpdateNotificationParamsDTO,
  NotificationCallToActionType,
  NotificationType,
} from '@bottomtime/api';
import { EventKey, NotificationsFeature } from '@bottomtime/common';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { RedisClientType } from 'redis';

import { RedisClient } from '../dependencies';
import { FriendRequestEvent, NotificationManagementEvent } from '../events';
import { FeaturesService } from '../features';
import { User } from '../users';
import { NotificationsService } from './notifications.service';

const ThirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

type CreateNotificationOptions = Omit<
  CreateOrUpdateNotificationParamsDTO,
  'active'
> & {
  eventKey: EventKey;
  user: User;
};

@Injectable()
export class NotificationEventsHandler {
  private readonly log = new Logger(NotificationEventsHandler.name);

  constructor(
    @Inject(NotificationsService)
    private readonly notifications: NotificationsService,

    @Inject(RedisClient)
    private readonly redis: RedisClientType,

    @Inject(FeaturesService)
    private readonly features: FeaturesService,
  ) {}

  private async createNotification(
    options: CreateNotificationOptions,
  ): Promise<void> {
    const notificationsEnabled = await this.features.getFeature(
      NotificationsFeature,
      options.user,
    );
    if (!notificationsEnabled) return;

    this.log.debug(
      `Notification event received. Sending notification to user "${options.user.username}": ${options.title}`,
    );
    try {
      const isAuthorized = await this.notifications.isNotificationAuthorized(
        options.user,
        NotificationType.PushNotification,
        options.eventKey,
      );
      if (!isAuthorized) return;

      const notification = await this.notifications.createNotification(options);
      await this.redis.publish(
        `notify-${options.user.id}`,
        JSON.stringify(notification.toJSON()),
      );
    } catch (error) {
      this.log.error(
        `Failed to create notification for user "${options.user.username}"`,
        error,
      );
    }
  }

  @OnEvent(EventKey.FriendRequestAccepted)
  @OnEvent(EventKey.FriendRequestCreated)
  @OnEvent(EventKey.FriendRequestRejected)
  async onFriendRequestEvent(event: FriendRequestEvent): Promise<void> {
    const userName = event.user.profile.name || `@${event.user.username}`;
    const friendName = event.friend.profile.name || `@${event.friend.username}`;

    let title: string;
    let message: string;
    let icon: string;
    let callsToAction: CreateOrUpdateNotificationParamsDTO['callsToAction'];
    let expires: number | undefined;
    let recipient: User;

    switch (event.key) {
      case EventKey.FriendRequestAccepted:
        title = 'Friend Request Accepted';
        icon = '👍';
        message = `**${friendName}** has accepted your friend request! Congratulations! You have a new dive buddy!`;
        expires = ThirtyDaysInMs;
        recipient = event.user;
        break;

      case EventKey.FriendRequestCreated:
        title = 'New Friend Request';
        icon = '👋';
        message = `**${userName}** has sent you a friend request. Dive in and make a new friend!`;
        callsToAction = [
          {
            caption: 'View friend requests',
            type: NotificationCallToActionType.Link,
            url: '/friendRequests',
          },
        ];
        recipient = event.friend;
        break;

      case EventKey.FriendRequestRejected:
        title = '‍️Friend Request Declined';
        icon = '🙅';
        message = `**${friendName}** has declined your friend request. Don't worry, there are plenty of other fish in the sea!`;
        if (event.friendRequest.reason) {
          message = `${message}\n\nReason given: *"${event.friendRequest.reason}"*`;
        }
        expires = ThirtyDaysInMs;
        recipient = event.user;
        break;
    }

    await this.createNotification({
      user: recipient,
      eventKey: event.key,
      title,
      message,
      icon,
      callsToAction,
      expires: expires ? Date.now() + expires : undefined,
    });
  }

  @OnEvent(EventKey.NotificationsDeleted)
  @OnEvent(EventKey.NotificationsDismissed)
  @OnEvent(EventKey.NotificationsUndismissed)
  async notificationModified(
    event: NotificationManagementEvent,
  ): Promise<void> {
    const results = await this.notifications.listNotifications({
      user: event.user,
      limit: 10,
      showDismissed: false,
    });

    this.redis.publish(
      `notify-${event.user.id}`,
      JSON.stringify({ ...results, reInit: true }),
    );
  }
}
