import mockFetch from 'fetch-mock-jest';
import { It, Mock, Times } from 'moq.ts';
import * as SocketIO from 'socket.io-client';

import {
  ApiList,
  Fetcher,
  GetNotificationsCountParamsDTO,
  ListNotificationsParamsDTO,
  NotificationDTO,
} from '../../src';
import {
  ConnectionObserver,
  NotificationsApiClient,
} from '../../src/client/notifications';

jest.mock('socket.io-client');

const Username = 'testuser';
const Notifications: ApiList<NotificationDTO> = {
  data: [
    {
      id: '9eb43845-9fbb-4cac-84a8-7d4dfa734080',
      title: 'Test Notification',
      message: 'This is a test notification',
      icon: '👌',
      dismissed: false,
      active: new Date('2021-01-01T00:00:00Z'),
    },
    {
      id: '9eb43845-9fbb-4cac-84a8-7d4dfa734080',
      title: 'Other Notification',
      message: 'This is a different test notification',
      icon: '👍',
      dismissed: false,
      active: new Date('2020-07-08T00:00:00Z'),
    },
  ],
  totalCount: 8,
};

describe('Notifications API Client', () => {
  let fetcher: Fetcher;
  let client: NotificationsApiClient;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new NotificationsApiClient(fetcher);
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it('will delete a notification', async () => {
    const notificationId = '9eb43845-9fbb-4cac-84a8-7d4dfa734080';
    mockFetch.delete(
      `/api/users/${Username}/notifications/${notificationId}`,
      204,
    );

    await client.deleteNotifications(Username, notificationId);

    expect(mockFetch.done()).toBe(true);
  });

  it('will delete multiple notifications', async () => {
    const notificationIds = [
      '9eb43845-9fbb-4cac-84a8-7d4dfa734080',
      '8b2dfaba-8993-4f0d-b096-839792e5345b',
      '39b337cb-b006-41cc-ab55-777181417427',
    ];
    mockFetch.delete(
      {
        url: `/api/users/${Username}/notifications`,
        body: notificationIds,
      },
      { totalCount: 3 },
    );

    await expect(
      client.deleteNotifications(Username, notificationIds),
    ).resolves.toBe(3);

    expect(mockFetch.done()).toBe(true);
  });

  it('will dismiss a notification', async () => {
    const notificationId = '9eb43845-9fbb-4cac-84a8-7d4dfa734080';
    mockFetch.post(
      `/api/users/${Username}/notifications/${notificationId}/dismiss`,
      204,
    );

    await client.dismissNotifications(Username, notificationId);

    expect(mockFetch.done()).toBe(true);
  });

  it('will dismiss multiple notifications', async () => {
    const notificationIds = [
      '9eb43845-9fbb-4cac-84a8-7d4dfa734080',
      '8b2dfaba-8993-4f0d-b096-839792e5345b',
      '39b337cb-b006-41cc-ab55-777181417427',
    ];
    mockFetch.post(
      {
        url: `/api/users/${Username}/notifications/dismiss`,
        body: notificationIds,
      },
      { totalCount: 3 },
    );

    await expect(
      client.dismissNotifications(Username, notificationIds),
    ).resolves.toBe(3);

    expect(mockFetch.done()).toBe(true);
  });

  it('will undismiss a notification', async () => {
    const notificationId = '9eb43845-9fbb-4cac-84a8-7d4dfa734080';
    mockFetch.post(
      `/api/users/${Username}/notifications/${notificationId}/undismiss`,
      204,
    );

    await client.undismissNotifications(Username, notificationId);

    expect(mockFetch.done()).toBe(true);
  });

  it('will undismiss multiple notifications', async () => {
    const notificationIds = [
      '9eb43845-9fbb-4cac-84a8-7d4dfa734080',
      '8b2dfaba-8993-4f0d-b096-839792e5345b',
      '39b337cb-b006-41cc-ab55-777181417427',
    ];
    mockFetch.post(
      {
        url: `/api/users/${Username}/notifications/undismiss`,
        body: notificationIds,
      },
      { totalCount: 3 },
    );

    await expect(
      client.undismissNotifications(Username, notificationIds),
    ).resolves.toBe(3);

    expect(mockFetch.done()).toBe(true);
  });

  it('will list notifications for a user', async () => {
    const options: ListNotificationsParamsDTO = {
      showAfter: new Date('2020-01-01T00:00:00Z'),
      showDismissed: false,
      skip: 10,
      limit: 2,
    };
    mockFetch.get(
      {
        url: `/api/users/${Username}/notifications`,
        query: {
          ...options,
          showAfter: options.showAfter!.toISOString(),
        },
      },
      { status: 200, body: Notifications },
    );

    const result = await client.listNotifications(Username, options);

    expect(result).toEqual(Notifications);
  });

  it('will return notification count for a user', async () => {
    const options: GetNotificationsCountParamsDTO = {
      showAfter: new Date('2020-01-01T00:00:00Z'),
      showDismissed: true,
    };
    const totalCount = 9;
    mockFetch.get(
      {
        url: `/api/users/${Username}/notifications/count`,
        query: {
          showDismissed: true,
          showAfter: options.showAfter!.toISOString(),
        },
      },
      { status: 200, body: { totalCount } },
    );

    await expect(client.getNotficationsCount(Username, options)).resolves.toBe(
      totalCount,
    );
  });

  describe('when receiving notifications over websocket', () => {
    let listeners: Record<string, jest.Mock>;
    let mockSocket: Mock<SocketIO.Socket>;
    let observer: ConnectionObserver;
    let socketIOSpy: jest.SpyInstance;

    beforeEach(() => {
      listeners = {};
      mockSocket = new Mock<SocketIO.Socket>();
      mockSocket
        .setup((s) => s.on(It.IsAny<string>(), It.IsAny()))
        .callback(({ args: [event, listener] }) => {
          listeners[event] = listener;
          return mockSocket.object();
        });
      mockSocket.setup((s) => s.disconnect()).returns(mockSocket.object());
      observer = {
        init: jest.fn(),
        newNotification: jest.fn(),
        connected: jest.fn(),
        disconnected: jest.fn(),
        error: jest.fn(),
      };
      socketIOSpy = jest
        .spyOn(SocketIO, 'io')
        .mockReturnValue(mockSocket.object());
    });

    it('will connect and receive events', async () => {
      const connection = client.connect(observer);

      expect(socketIOSpy).toHaveBeenCalledWith('/notifications', {
        path: '/ws/',
        transports: ['websocket'],
        withCredentials: true,
      });

      expect(listeners.connect).toBeDefined();
      expect(listeners.disconnect).toBeDefined();
      expect(listeners.connect_error).toBeDefined();
      expect(listeners.init).toBeDefined();
      expect(listeners.notify).toBeDefined();

      listeners.connect();
      listeners.init(Notifications);
      listeners.notify({
        data: [Notifications.data[0]],
        totalCount: Notifications.totalCount + 1,
      });

      expect(observer.connected).toHaveBeenCalled();
      expect(observer.init).toHaveBeenCalledWith(Notifications);
      expect(observer.newNotification).toHaveBeenCalledWith({
        data: [Notifications.data[0]],
        totalCount: Notifications.totalCount + 1,
      });

      connection.disconnect();
      mockSocket.verify((s) => s.disconnect(), Times.Once());
    });
  });
});
