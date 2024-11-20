import { NotificationDTO } from '@bottomtime/api';

import { Inject } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from '@nestjs/websockets';

import { Observable, concatMap, from, interval, map } from 'rxjs';
import { Socket } from 'socket.io';
import { z } from 'zod';

import { ZodValidator } from '../../zod-validator';
import { CurrentUser } from '../current-user';
import { User } from '../user';
import { Notification } from './notification';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({
  namespace: 'notifications',
})
export class NotificationsGateway {
  constructor(
    @Inject(NotificationsService)
    private readonly service: NotificationsService,
  ) {}

  private async getNotificationsForUser(user: User): Promise<Notification[]> {
    const { data } = await this.service.listNotifications({
      user,
      showDismissed: false,
      limit: 200,
    });
    return data;
  }

  @SubscribeMessage('notifications')
  handleNotification(
    @CurrentUser() user: User,
    @MessageBody('timestamp', new ZodValidator(z.coerce.date()))
    timestamp: Date,
  ): Observable<WsResponse<NotificationDTO>> {
    return interval(5000).pipe(
      concatMap(() => this.getNotificationsForUser(user)),
      concatMap((notifications) => from(notifications)),
      map((notification) => ({
        event: 'notification',
        data: notification.toJSON(),
      })),
    );
  }
}
