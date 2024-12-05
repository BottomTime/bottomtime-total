import { NotificationCallToActionType, NotificationDTO } from '@bottomtime/api';

import { faker } from '@faker-js/faker';

import { NotificationEntity, UserEntity } from '../../../src/data';

export function fakeNotification(userIds: string[]): NotificationEntity {
  const ctas: NonNullable<NotificationDTO['callsToAction']> = [
    {
      type: NotificationCallToActionType.Link,
      caption: 'Go home',
      url: '/',
    },
    {
      type: NotificationCallToActionType.Link,
      caption: 'See friends',
      url: '/friends',
    },
    {
      type: NotificationCallToActionType.LinkToNewTab,
      caption: 'Google it',
      url: 'https://google.com',
    },
  ];
  const data = new NotificationEntity();

  data.id = faker.string.uuid();
  data.active = faker.date.recent({ days: 4 });
  data.callsToAction = [faker.helpers.arrayElement(ctas)];
  data.dismissed = false;
  data.expires = faker.date.soon({ days: 60 });
  data.icon = faker.helpers.arrayElement(['👍', '💀', '🎉', '❤']);
  data.message = faker.lorem.paragraph();
  data.title = faker.lorem.words({ min: 2, max: 4 });
  data.recipient = { id: faker.helpers.arrayElement(userIds) } as UserEntity;

  return data;
}
