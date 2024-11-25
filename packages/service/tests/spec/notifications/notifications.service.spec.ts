import { NotificationType } from '@bottomtime/api';
import { EventKey } from '@bottomtime/common';

import { Repository } from 'typeorm';
import { ZodError } from 'zod';

import {
  NotificationEntity,
  NotificationWhitelistEntity,
  UserEntity,
} from '../../../src/data';
import {
  CreateNotificationOptions,
  NotificationsService,
} from '../../../src/notifications';
import { User } from '../../../src/users';
import { dataSource } from '../../data-source';
import NotificationTestData from '../../fixtures/notifications.json';
import { parseNotificationJSON } from '../../utils/create-test-notification';
import { createTestUser } from '../../utils/create-test-user';

const UserId = '3850992b-d5cb-47f9-be99-3249d4fad24f';
const OtherUserId = '3ab16273-2932-435d-a703-e03cb5a8c53c';

describe('Notifications Service', () => {
  let Users: Repository<UserEntity>;
  let Notifications: Repository<NotificationEntity>;
  let NotificationWhitelists: Repository<NotificationWhitelistEntity>;
  let service: NotificationsService;

  let userData: UserEntity;
  let otherUserData: UserEntity;
  let user: User;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    Notifications = dataSource.getRepository(NotificationEntity);
    NotificationWhitelists = dataSource.getRepository(
      NotificationWhitelistEntity,
    );
    userData = createTestUser({ id: UserId });
    otherUserData = createTestUser({ id: OtherUserId });

    service = new NotificationsService(Notifications, NotificationWhitelists);
    user = new User(Users, userData);
  });

  beforeEach(async () => {
    await Users.save(userData);
  });

  describe('when listing notifications for a user', () => {
    let notificationsData: NotificationEntity[];

    beforeAll(() => {
      notificationsData = NotificationTestData.map((notification) =>
        parseNotificationJSON(notification, userData),
      );
    });

    beforeEach(async () => {
      await Notifications.save(notificationsData);
    });

    it('will list notifications with default options', async () => {
      const result = await service.listNotifications({
        user,
      });
      expect(result.totalCount).toBe(21);
      expect(result.data).toHaveLength(21);
      expect(result.data).toMatchSnapshot();
    });

    it('will return an empty result set if user ID does not exist', async () => {
      const result = await service.listNotifications({
        user: new User(
          Users,
          createTestUser({ id: '4262171d-9ac9-46d9-9ad9-e2d3628eab37' }),
        ),
      });
      expect(result.totalCount).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it('will list notifications with pagination', async () => {
      const result = await service.listNotifications({
        user,
        skip: 8,
        limit: 10,
      });
      expect(result.totalCount).toBe(21);
      expect(result.data).toHaveLength(10);
      expect(result.data).toMatchSnapshot();
    });

    it('will list notifications and include dismissed notifications upon request', async () => {
      const result = await service.listNotifications({
        user,
        showDismissed: true,
      });
      expect(result.totalCount).toBe(NotificationTestData.length);
      expect(result.data).toHaveLength(50);
      expect(result.data).toMatchSnapshot();
    });

    it('will list notifications marked active after a given timestamp', async () => {
      const result = await service.listNotifications({
        user,
        showAfter: new Date('2024-01-21T17:06:46.681Z'),
      });
      expect(result.totalCount).toBe(8);
      expect(result.data).toHaveLength(8);
      expect(result.data).toMatchSnapshot();
    });
  });

  describe('when retrieving a single notification', () => {
    it('will return the requested notification', async () => {
      const notificationData = parseNotificationJSON(
        NotificationTestData[3],
        userData,
      );
      await Notifications.save(notificationData);

      const result = await service.getNotification(
        userData.id,
        notificationData.id,
      );

      expect(result).toBeDefined();
      expect(result).toMatchSnapshot();
    });

    it('will return undefined if the notification does not exist', async () => {
      const result = await service.getNotification(
        userData.id,
        'c3f60249-bd90-4733-b5d8-861e61408b42',
      );
      expect(result).toBeUndefined();
    });

    it('will return undefined if the notification does not belong to the user', async () => {
      const notificationData = parseNotificationJSON(
        NotificationTestData[3],
        userData,
      );
      await Notifications.save(notificationData);

      const result = await service.getNotification(
        OtherUserId,
        notificationData.id,
      );

      expect(result).toBeUndefined();
    });
  });

  describe('when creating a new notification', () => {
    it('will create a new notification with minimal properties', async () => {
      const options: CreateNotificationOptions = {
        user,
        icon: 'fas fa-bell',
        title: 'Test Notification',
        message: 'This is a test notification.',
      };

      const result = await service.createNotification(options);
      expect(result.active?.valueOf()).toBeCloseTo(Date.now(), -3);
      expect(result.dismissed).toBe(false);
      expect(result.expires).toBeUndefined();
      expect(result.icon).toBe(options.icon);
      expect(result.message).toBe(options.message);
      expect(result.title).toBe(options.title);

      const saved = await Notifications.findOneOrFail({
        relations: ['recipient'],
        where: { id: result.id },
      });
      expect(saved.active).toEqual(result.active);
      expect(saved.dismissed).toBe(false);
      expect(saved.expires).toBeNull();
      expect(saved.icon).toBe(options.icon);
      expect(saved.message).toBe(options.message);
      expect(saved.title).toBe(options.title);
    });

    it('will create a new notification with all properties', async () => {
      const options: CreateNotificationOptions = {
        user,
        icon: 'fas fa-bell',
        title: 'Test Notification',
        message: 'This is a test notification.',
        active: new Date('2024-03-21T17:06:46.681Z'),
        expires: new Date('2024-04-21T17:06:46.681Z'),
      };

      const result = await service.createNotification(options);
      expect(result.active).toEqual(options.active);
      expect(result.dismissed).toBe(false);
      expect(result.expires).toEqual(options.expires);
      expect(result.icon).toBe(options.icon);
      expect(result.message).toBe(options.message);
      expect(result.title).toBe(options.title);

      const saved = await Notifications.findOneOrFail({
        relations: ['recipient'],
        where: { id: result.id },
      });
      expect(saved.active).toEqual(options.active);
      expect(saved.dismissed).toBe(false);
      expect(saved.expires).toEqual(options.expires);
      expect(saved.icon).toBe(options.icon);
      expect(saved.message).toBe(options.message);
      expect(saved.title).toBe(options.title);
    });
  });

  describe('when purging expired notifications', () => {
    beforeAll(() => {
      jest.useFakeTimers({
        now: new Date('2024-04-14T20:31:21.943Z'),
        doNotFake: ['setImmediate', 'nextTick'],
      });
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('will purge all expired notifications', async () => {
      const notificationsData = NotificationTestData.map(
        (notification, index) =>
          parseNotificationJSON(
            notification,
            index % 2 === 0 ? userData : otherUserData,
          ),
      );
      await Users.save(otherUserData);
      await Notifications.save(notificationsData);

      const count = await service.purgeExpiredNotifications();
      expect(count).toBe(25);

      const now = Date.now();
      const [remaining, remainingCount] = await Notifications.findAndCount();
      expect(remainingCount).toBe(25);
      for (const notification of remaining) {
        expect(
          notification.expires === null ||
            notification.expires?.valueOf() > now,
        ).toBe(true);
      }
    });
  });

  describe('when retrieving notification whitelist for a user', () => {
    it('willl return the notification whitelist for a user with a given type', async () => {
      const whitelist: NotificationWhitelistEntity = {
        id: '17a140b2-43ac-42ad-8d9e-b67c77daff15',
        user: userData,
        type: NotificationType.Email,
        whitelist: ['friendRequests.*', 'membership.*'],
      };
      await NotificationWhitelists.save(whitelist);
      const result = await service.getNotificationWhitelist(
        user,
        NotificationType.Email,
      );

      expect(result).toBeDefined();
      const values = Array.from(result.values());
      expect(values).toEqual(whitelist.whitelist);
    });

    it('will return default whitelist if no whitelist exists for a user with a given type', async () => {
      const whitelist: NotificationWhitelistEntity = {
        id: '17a140b2-43ac-42ad-8d9e-b67c77daff15',
        user: userData,
        type: NotificationType.Email,
        whitelist: ['friendRequests.*', 'membership.*'],
      };
      await NotificationWhitelists.save(whitelist);
      const result = await service.getNotificationWhitelist(
        user,
        NotificationType.PushNotification,
      );

      expect(result).toBeDefined();
      const values = Array.from(result.values());
      expect(values).toEqual(['*']);
    });
  });

  describe('when updating notification whitelist for a user', () => {
    it('will add a new record for users that do not yet have a whitelist', async () => {
      const otherWhitelist: NotificationWhitelistEntity = {
        id: '17a140b2-43ac-42ad-8d9e-b67c77daff15',
        user: userData,
        type: NotificationType.PushNotification,
        whitelist: ['friendRequest.*', 'membership.*'],
      };
      await NotificationWhitelists.save(otherWhitelist);

      const whitelist = new Set(['friendRequest.*', 'membership.*']);
      await service.updateNotificationWhitelist(
        user,
        NotificationType.Email,
        whitelist,
      );

      const result = await NotificationWhitelists.findOneBy({
        user: userData,
        type: NotificationType.Email,
      });

      expect(result).toBeDefined();
      expect(result?.whitelist).toEqual(Array.from(whitelist));

      await NotificationWhitelists.findOneOrFail({
        where: {
          user: userData,
          type: NotificationType.PushNotification,
        },
      });
    });

    it('will update an existing whitelist record for a user', async () => {
      const whitelist: NotificationWhitelistEntity = {
        id: '17a140b2-43ac-42ad-8d9e-b67c77daff15',
        user: userData,
        type: NotificationType.Email,
        whitelist: ['friendRequest.*', 'membership.*'],
      };
      await NotificationWhitelists.save(whitelist);

      const newWhitelist = new Set([
        'friendRequest.accepted',
        'membership.*',
        'user.*',
      ]);
      await service.updateNotificationWhitelist(
        user,
        NotificationType.Email,
        newWhitelist,
      );

      const result = await NotificationWhitelists.findOneBy({
        user: userData,
        type: NotificationType.Email,
      });

      expect(result).toBeDefined();
      expect(result?.whitelist).toEqual(Array.from(newWhitelist));
    });

    it('will throw an exception if whitelist is invalid', async () => {
      const whitelist = new Set(['notValid.*', '#&!(']);
      await expect(
        service.updateNotificationWhitelist(
          user,
          NotificationType.Email,
          whitelist,
        ),
      ).rejects.toThrow(ZodError);
    });

    it('will allow users to set an empty whitelist', async () => {
      await service.updateNotificationWhitelist(
        user,
        NotificationType.Email,
        new Set(),
      );

      const result = await NotificationWhitelists.findOneBy({
        user: userData,
        type: NotificationType.Email,
      });

      expect(result).toBeDefined();
      expect(result?.whitelist).toEqual([]);
    });
  });

  describe('when checking if an event key is authorized by a whitelist', () => {
    [
      {
        key: EventKey.MembershipChanged,
        whitelist: new Set(['membership.changed']),
        expected: true,
      },
      {
        key: EventKey.MembershipChanged,
        whitelist: new Set(['membership.*']),
        expected: true,
      },
      {
        key: EventKey.MembershipChanged,
        whitelist: new Set(['*']),
        expected: true,
      },
      {
        key: EventKey.MembershipChanged,
        whitelist: new Set(['membership.*', 'user.*']),
        expected: true,
      },
      {
        key: EventKey.MembershipChanged,
        whitelist: new Set(['user.*']),
        expected: false,
      },
      {
        key: EventKey.MembershipChanged,
        whitelist: new Set(['user.created']),
        expected: false,
      },
      {
        key: EventKey.MembershipChanged,
        whitelist: new Set<string>(),
        expected: false,
      },
    ].forEach(({ key, whitelist, expected }, index) => {
      it(`will return ${expected} for test case #${index}`, () => {
        expect(service.isAuthorizedByWhitelist(key, whitelist)).toBe(expected);
      });
    });
  });

  describe('when looking up a whitelist to verify an event key', () => {
    it('will return true if the event key is authorized by the whitelist', async () => {
      const whitelist: NotificationWhitelistEntity = {
        id: '17a140b2-43ac-42ad-8d9e-b67c77daff15',
        user: userData,
        type: NotificationType.Email,
        whitelist: ['friendRequest.*', 'membership.*'],
      };
      await NotificationWhitelists.save(whitelist);

      const result = await service.isNotificationAuthorized(
        user,
        NotificationType.Email,
        EventKey.MembershipInvoiceCreated,
      );

      expect(result).toBe(true);
    });

    it('will return false if the event key is not authorized by the whitelist', async () => {
      const whitelist: NotificationWhitelistEntity = {
        id: '17a140b2-43ac-42ad-8d9e-b67c77daff15',
        user: userData,
        type: NotificationType.Email,
        whitelist: ['friendRequest.*', 'membership.*'],
      };
      await NotificationWhitelists.save(whitelist);

      const result = await service.isNotificationAuthorized(
        user,
        NotificationType.Email,
        EventKey.UserCreated,
      );

      expect(result).toBe(false);
    });

    it('will return true if the whitelist does not exist', async () => {
      const result = await service.isNotificationAuthorized(
        user,
        NotificationType.Email,
        EventKey.UserCreated,
      );

      expect(result).toBe(true);
    });

    it('will return false if the whitelist is empty', async () => {
      const whitelist: NotificationWhitelistEntity = {
        id: '17a140b2-43ac-42ad-8d9e-b67c77daff15',
        user: userData,
        type: NotificationType.Email,
        whitelist: [],
      };
      await NotificationWhitelists.save(whitelist);

      const result = await service.isNotificationAuthorized(
        user,
        NotificationType.Email,
        EventKey.UserCreated,
      );

      expect(result).toBe(false);
    });
  });
});
