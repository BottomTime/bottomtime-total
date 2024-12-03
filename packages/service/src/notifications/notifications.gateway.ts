import { NotificationDTO } from '@bottomtime/api';

import { Inject, Logger, UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from '@nestjs/websockets';

import { RedisClientType } from 'redis';
import { Observable, concatMap, from, interval, map } from 'rxjs';
import { Socket } from 'socket.io';

import { RedisClient } from '../dependencies';
import { CurrentUser } from '../users/current-user';
import { User } from '../users/user';
import { AssertNotificationsFeature } from './assert-notifications-feature.guard';
import { Notification } from './notification';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({
  namespace: 'notifications',
})
@UseGuards(AssertNotificationsFeature)
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly log = new Logger(NotificationsGateway.name);

  constructor(
    @Inject(NotificationsService)
    private readonly service: NotificationsService,

    @Inject(RedisClient)
    private readonly redis: RedisClientType,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    this.log.debug(client.handshake.headers);
  }

  handleDisconnect(client: Socket) {
    this.log.debug('Disconnected');
  }
}
