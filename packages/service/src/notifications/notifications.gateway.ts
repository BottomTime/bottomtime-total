import {
  Inject,
  Logger,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';

import { parse as parseCookies } from 'cookie';
import { IncomingHttpHeaders } from 'http';
import { RedisClientType } from 'redis';
import { Socket } from 'socket.io';

import { AuthService } from '../auth';
import { Config } from '../config';
import { RedisClient } from '../dependencies';
import { AssertNotificationsFeature } from './assert-notifications-feature.guard';
import { NotificationsService } from './notifications.service';

const AuthHeaderRegex = /^bearer\s+(\S+)$/i;

@WebSocketGateway({
  namespace: 'notifications',
  path: '/ws',
})
@UseGuards(AssertNotificationsFeature)
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly log = new Logger(NotificationsGateway.name);
  private readonly subscriptions: Record<string, RedisClientType> = {};

  constructor(
    @Inject(NotificationsService)
    private readonly notifications: NotificationsService,

    @Inject(AuthService)
    private readonly auth: AuthService,

    @Inject(RedisClient)
    private readonly redis: RedisClientType,
  ) {}

  private extractAuthToken(headers: IncomingHttpHeaders): string | null {
    if (headers.authorization && AuthHeaderRegex.test(headers.authorization)) {
      this.log.debug(
        'Websocket connection: Found auth token in Authorization header.',
      );
      return headers.authorization.substring(7).trim();
    }

    if (headers.cookie) {
      const cookies = parseCookies(headers.cookie);
      if (cookies[Config.sessions.cookieName]) {
        this.log.debug(
          'Websocket connection: Found auth token in session cookie.',
        );
        return cookies[Config.sessions.cookieName] || null;
      }
    }

    return null;
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const authToken = this.extractAuthToken(client.handshake.headers);
      if (!authToken) {
        throw new UnauthorizedException(
          'Unable to authenticate connection. JWT must be supplied in Authorization header or in session cookie.',
        );
      }

      const user = await this.auth.validateJwt(authToken);

      this.log.log(
        `Websocket connection: Authenticated user as "${user.username}" (ID=${user.id}).`,
      );

      const result = await this.notifications.listNotifications({
        user,
        limit: 10,
        showDismissed: false,
      });

      client.emit('init', result);

      const redisClient = this.redis.duplicate();
      await redisClient.connect();
      redisClient.subscribe(`notify-${user.id}`, async (msg): Promise<void> => {
        this.log.debug(`Received notification: ${msg}`);
        const totalCount = await this.notifications.getNotificationsCount(
          user,
          { showDismissed: false },
        );
        client.emit('notify', {
          data: [JSON.parse(msg)],
          totalCount,
        });
      });

      this.subscriptions[client.id] = redisClient;
    } catch (error) {
      this.log.error(error);
      client.emit(
        'error',
        error instanceof Error
          ? error.message
          : 'An error occurred while establishing the connection.',
      );
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    if (this.subscriptions[client.id]) {
      this.log.debug('Disconnecting Websocket client...');
      await this.subscriptions[client.id].disconnect();
      delete this.subscriptions[client.id];
    }
  }
}
