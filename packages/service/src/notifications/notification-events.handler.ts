import { NotificationType } from '@bottomtime/api';
import { NotificationsFeature } from '@bottomtime/common';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { EventKey, FriendRequestEvent } from '../events';
import { FeaturesService } from '../features';
import { User, UsersService } from '../users';
import { NotificationsService } from './notifications.service';

const ThirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class NotificationEventsHandler {
  private readonly log = new Logger(NotificationEventsHandler.name);

  constructor(
    @Inject(NotificationsService)
    private readonly notifications: NotificationsService,

    @Inject(UsersService)
    private readonly users: UsersService,

    @Inject(FeaturesService)
    private readonly features: FeaturesService,
  ) {}

  private async createNotification(
    user: User,
    eventKey: EventKey,
    title: string,
    message: string,
    expirationInMs?: number,
  ): Promise<void> {
    const notificationsEnabled = await this.features.getFeature(
      NotificationsFeature,
    );
    if (!notificationsEnabled) return;

    this.log.debug(
      `Notification event received. Sending notification to user "${user.username}": ${title}`,
    );
    try {
      const isAuthorized = await this.notifications.isNotificationAuthorized(
        user,
        NotificationType.PushNotification,
        eventKey,
      );
      if (!isAuthorized) return;

      await this.notifications.createNotification({
        icon: '',
        message,
        title,
        user,
        active: new Date(),
        expires: expirationInMs
          ? new Date(Date.now() + expirationInMs)
          : undefined,
      });
    } catch (error) {
      this.log.error(
        `Failed to create notification for user "${user.username}"`,
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
    let expires: number | undefined;
    let recipient: User;

    switch (event.key) {
      case EventKey.FriendRequestAccepted:
        title = '👍 Friend Request Accepted';
        message = `**${friendName}** has accepted your friend request! Congratulations! You have a new dive buddy!`;
        expires = ThirtyDaysInMs;
        recipient = event.user;
        break;

      case EventKey.FriendRequestCreated:
        title = '👋 New Friend Request';
        message = `
**${userName}** has sent you a friend request. Dive in and make a new friend!

[View friend requests](/friendRequests)`;
        recipient = event.friend;
        break;

      case EventKey.FriendRequestRejected:
        title = '🙅‍♀️ Friend Request Declined';
        message = `**${friendName}** has declined your friend request. Don't worry, there are plenty of other fish in the sea!`;
        if (event.friendRequest.reason) {
          message = `${message}\n\nReason given: *"${event.friendRequest.reason}"*`;
        }
        expires = ThirtyDaysInMs;
        recipient = event.user;
        break;
    }

    await this.createNotification(
      recipient,
      event.key,
      title,
      message,
      expires,
    );
  }
}
