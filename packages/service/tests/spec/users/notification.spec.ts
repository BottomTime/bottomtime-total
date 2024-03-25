import { Repository } from 'typeorm';

import { NotificationEntity, UserEntity } from '../../../src/data';
import { Notification } from '../../../src/users';
import { dataSource } from '../../data-source';
import { createTestNotification } from '../../utils/create-test-notification';
import { createTestUser } from '../../utils/create-test-user';

const UserId = '2a1d56fa-236a-49d1-a475-068b60cf3621';
const NotificationData: Partial<NotificationEntity> = {
  id: '2a1d56fa-236a-49d1-a475-068b60cf3621',
  icon: 'fas fa-bell',
  title: 'Test Notification',
  message: 'This is a test notification.',
  active: new Date('2024-03-20T17:06:46.681Z'),
  expires: new Date('2024-04-20T17:06:46.681Z'),
  dismissed: true,
} as const;

describe('Notification class', () => {
  let Users: Repository<UserEntity>;
  let Notifications: Repository<NotificationEntity>;
  let userData: UserEntity;

  let notificationData: NotificationEntity;
  let notification: Notification;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    Notifications = dataSource.getRepository(NotificationEntity);

    userData = createTestUser({ id: UserId });
  });

  beforeEach(async () => {
    notificationData = createTestNotification(userData, NotificationData);
    notification = new Notification(Notifications, notificationData);

    await Users.save(userData);
  });

  it('will return properties correctly', () => {
    expect(notification.id).toBe(notificationData.id);
    expect(notification.icon).toBe(notificationData.icon);
    expect(notification.title).toBe(notificationData.title);
    expect(notification.message).toBe(notificationData.message);
    expect(notification.active).toBe(notificationData.active);
    expect(notification.expires).toBe(notificationData.expires);
    expect(notification.dismissed).toBe(notificationData.dismissed);
  });

  it('will return undefined for properties that are not set', () => {
    notification = new Notification(Notifications, new NotificationEntity());
    expect(notification.expires).toBeUndefined();
  });

  it('will allow properties to be set correctly', () => {
    const newIcon = 'fas fa-bell-slash';
    const newTitle = 'New Test Notification';
    const newMessage = 'This is a new test notification.';
    const newActive = new Date('2024-03-21T17:06:46.681Z');
    const newExpires = new Date('2024-04-21T17:06:46.681Z');

    notification.icon = newIcon;
    notification.title = newTitle;
    notification.message = newMessage;
    notification.active = newActive;
    notification.expires = newExpires;

    expect(notification.icon).toBe(newIcon);
    expect(notification.title).toBe(newTitle);
    expect(notification.message).toBe(newMessage);
    expect(notification.active).toBe(newActive);
    expect(notification.expires).toBe(newExpires);
  });

  it('will save changes to an existing notification', async () => {
    await Notifications.save(notificationData);

    const newIcon = 'fas fa-bell-slash';
    const newTitle = 'New Test Notification';
    const newMessage = 'This is a new test notification.';
    const newActive = new Date('2024-03-21T17:06:46.681Z');
    const newExpires = new Date('2024-04-21T17:06:46.681Z');

    notification.icon = newIcon;
    notification.title = newTitle;
    notification.message = newMessage;
    notification.active = newActive;
    notification.expires = newExpires;

    await notification.save();

    const saved = await Notifications.findOneByOrFail({ id: notification.id });
    expect(saved.icon).toBe(newIcon);
    expect(saved.title).toBe(newTitle);
    expect(saved.message).toBe(newMessage);
    expect(saved.active).toEqual(newActive);
    expect(saved.expires).toEqual(newExpires);
  });

  it('will save a new notification', async () => {
    await notification.save();

    const saved = await Notifications.findOneOrFail({
      relations: ['recipient'],
      where: { id: notification.id },
    });
    expect(saved.icon).toBe(notification.icon);
    expect(saved.title).toBe(notification.title);
    expect(saved.message).toBe(notification.message);
    expect(saved.active).toEqual(notification.active);
    expect(saved.expires).toEqual(notification.expires);
    expect(saved.recipient?.id).toBe(userData.id);
  });

  it('will delete a notification', async () => {
    await Notifications.save(notificationData);
    await notification.delete();
    await expect(
      Notifications.findOneBy({ id: notification.id }),
    ).resolves.toBeNull();
  });

  it('will do nothing when deleting a notification that does not exist', async () => {
    await notification.delete();
  });

  [true, false].forEach((dismissed) => {
    it(`will mark a notification as ${
      dismissed ? 'dismissed' : 'undismissed'
    } when it is ${dismissed ? 'not dismissed' : 'dismissed'}`, async () => {
      notificationData.dismissed = !dismissed;
      await Notifications.save(notificationData);

      await notification.markDismissed(dismissed);

      const saved = await Notifications.findOneOrFail({
        where: {
          id: notification.id,
        },
        select: ['dismissed'],
      });
      expect(saved.dismissed).toBe(dismissed);
    });

    it(`will do nothing when marking a notification as ${
      dismissed ? 'dismissed' : 'undismissed'
    } when it is already in that state`, async () => {
      notificationData.dismissed = dismissed;
      await Notifications.save(notificationData);

      await notification.markDismissed(dismissed);

      const saved = await Notifications.findOneOrFail({
        where: {
          id: notification.id,
        },
        select: ['dismissed'],
      });
      expect(saved.dismissed).toBe(dismissed);
    });
  });
});
