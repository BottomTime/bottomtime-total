/* eslint-disable no-console */
import { Socket, io } from 'socket.io-client';

export class NotificationsApiClient {
  private socket: Socket | undefined;

  connect() {
    this.socket = io('/notifications', {
      path: '/ws/',
      transports: ['websocket'],
      withCredentials: true,
    });
  }
}
