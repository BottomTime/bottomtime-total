import { Repository } from 'typeorm';

import { NotificationEntity, UserEntity } from '../../../src/data';
import {
  CreateNotificationOptions,
  NotificationsService,
} from '../../../src/users';
import { dataSource } from '../../data-source';
import NotificationTestData from '../../fixtures/notifications.json';
import { parseNotificationJSON } from '../../utils/create-test-notification';
import { createTestUser } from '../../utils/create-test-user';

const UserId = '3850992b-d5cb-47f9-be99-3249d4fad24f';
const OtherUserId = '3ab16273-2932-435d-a703-e03cb5a8c53c';

describe('Notifications Service', () => {
  let Users: Repository<UserEntity>;
  let Notifications: Repository<NotificationEntity>;
  let service: NotificationsService;

  let userData: UserEntity;
  let otherUserData: UserEntity;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    Notifications = dataSource.getRepository(NotificationEntity);
    userData = createTestUser({ id: UserId });
    otherUserData = createTestUser({ id: OtherUserId });

    service = new NotificationsService(Notifications);
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
        userId: UserId,
      });
      expect(result.totalCount).toBe(21);
      expect(result.data).toHaveLength(21);
      expect(result.data).toMatchSnapshot();
    });

    it('will return an empty result set if user ID does not exist', async () => {
      const result = await service.listNotifications({
        userId: OtherUserId,
      });
      expect(result.totalCount).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it('will list notifications with pagination', async () => {
      const result = await service.listNotifications({
        userId: UserId,
        skip: 8,
        limit: 10,
      });
      expect(result.totalCount).toBe(21);
      expect(result.data).toHaveLength(10);
      expect(result.data).toMatchSnapshot();
    });

    it('will list notifications and include dismissed notifications upon request', async () => {
      const result = await service.listNotifications({
        userId: UserId,
        showDismissed: true,
      });
      expect(result.totalCount).toBe(NotificationTestData.length);
      expect(result.data).toHaveLength(50);
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
        userId: UserId,
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
        userId: UserId,
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
});
