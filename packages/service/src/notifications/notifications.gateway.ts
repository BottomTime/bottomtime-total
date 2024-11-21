import { NotificationDTO } from '@bottomtime/api';

import { Inject, UseGuards } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from '@nestjs/websockets';

import { Observable, concatMap, from, interval, map } from 'rxjs';

import { CurrentUser } from '../users/current-user';
import { User } from '../users/user';
import { AssertNotificationsFeature } from './assert-notifications-feature.guard';
import { Notification } from './notification';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({
  namespace: 'notifications',
})
@UseGuards(AssertNotificationsFeature)
export class NotificationsGateway {
  constructor(
    @Inject(NotificationsService)
    private readonly service: NotificationsService,
  ) {}

  private async getNotificationsForUser(
    user: User,
    showAfter?: Date,
  ): Promise<Notification[]> {
    const { data } = await this.service.listNotifications({
      user,
      showAfter,
      showDismissed: false,
      limit: 200,
    });
    return data;
  }

  // TODO: Not sure this is the right approach. Don't like how I think this will perform.
  // Review this carefully before releasing this endpoint.
  // Honestly, we should probably using Redis for caching notifications
  @SubscribeMessage('notifications')
  handleNotification(
    @CurrentUser() user: User,
  ): Observable<WsResponse<NotificationDTO>> {
    let timestamp: Date | undefined = undefined;
    return interval(5000).pipe(
      concatMap(() => {
        const result = this.getNotificationsForUser(user, timestamp);
        timestamp = new Date();
        return result;
      }),
      concatMap((notifications) => from(notifications)),
      map((notification) => ({
        event: 'notification',
        data: notification.toJSON(),
      })),
    );
  }
}
