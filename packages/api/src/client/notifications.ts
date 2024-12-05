/* eslint-disable no-console */
import { Socket, io } from 'socket.io-client';

import {
  ApiList,
  INotificationListener,
  ListNotificationsParamsDTO,
  ListNotificationsResponseSchema,
  NotificationDTO,
} from '../types';
import { Fetcher } from './fetcher';

export type ConnectionObserver = {
  init: (msg: ApiList<NotificationDTO>) => void;
  newNotification: (msg: ApiList<NotificationDTO>) => void;
  connected?: () => void;
  disconnected?: () => void;
  error?: (error: unknown) => void;
};

class NotificationListener implements INotificationListener {
  constructor(private readonly socket: Socket) {}

  disconnect() {
    this.socket.disconnect();
  }
}

export class NotificationsApiClient {
  constructor(private readonly client: Fetcher) {}

  connect(observer: ConnectionObserver): INotificationListener {
    const socket = io('/notifications', {
      path: '/ws/',
      transports: ['websocket'],
      withCredentials: true,
    })
      .on('connect', () => {
        if (observer.connected) {
          observer.connected();
        } else {
          console.debug('Connected to notifications websocket.');
        }
      })
      .on('disconnect', () => {
        if (socket?.active) {
          // Socket will attempt to reconnect.
        } else {
          // Socket was deliberately closed by the client or the server.
          if (observer.disconnected) {
            observer.disconnected();
          } else {
            console.debug('Disconnected from notifications websocket.');
          }
        }
      })
      .on('connect_error', (error: Error) => {
        if (observer.error) {
          observer.error(error);
        } else {
          console.error('Failed to connect to notifications websocket:', error);
        }
      })
      .on('init', (msg: unknown) => {
        const notifications = ListNotificationsResponseSchema.safeParse(msg);
        if (notifications.success) {
          observer.init(notifications.data);
        } else {
          console.warn(
            'Failed to parse initial notifications recieved over websocket.',
            notifications.error.issues,
          );
        }
      })
      .on('notify', (msg: unknown) => {
        const notification = ListNotificationsResponseSchema.safeParse(msg);
        if (notification.success) {
          observer.newNotification(notification.data);
        } else {
          console.warn(
            'Failed to parse notification recieved over websocket.',
            notification.error.issues,
          );
        }
      });

    return new NotificationListener(socket);
  }

  async dismissNotification(
    username: string,
    notificationId: string,
  ): Promise<void> {
    await this.client.post(
      `/api/users/${username}/notifications/${notificationId}/dismiss`,
    );
  }

  async listNotifications(
    username: string,
    options?: ListNotificationsParamsDTO,
  ): Promise<ApiList<NotificationDTO>> {
    const { data } = await this.client.get(
      `/api/users/${username}/notifications`,
      options,
      ListNotificationsResponseSchema,
    );
    return data;
  }
}
