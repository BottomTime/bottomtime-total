import { Inject, Logger, UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';

import { RedisClientType } from 'redis';
import { Socket } from 'socket.io';

import { RedisClient } from '../dependencies';
import { AssertNotificationsFeature } from './assert-notifications-feature.guard';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({
  namespace: 'notifications',
  path: '/ws',
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
