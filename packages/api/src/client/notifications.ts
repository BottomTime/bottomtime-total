/* eslint-disable no-console */
export class NotificationsApiClient {
  private socket: WebSocket | undefined;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket) {
        reject(new Error('Already connected. Call disconnect() first.'));
      }

      this.socket = new WebSocket('ws://localhost:4800/notifications');
      this.socket.onopen = () => {};
      this.socket.onclose = () => {};
      this.socket.onmessage = (event) => {};
      this.socket.onerror = (error) => {};
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }
  }
}
