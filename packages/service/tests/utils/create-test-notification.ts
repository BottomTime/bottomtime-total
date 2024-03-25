import { faker } from '@faker-js/faker';

import { NotificationEntity, UserEntity } from '../../src/data';

export function createTestNotification(
  recipient: UserEntity,
  options?: Partial<NotificationEntity>,
): NotificationEntity {
  const notification = new NotificationEntity();
  notification.id = options?.id ?? faker.datatype.uuid();
  notification.recipient = recipient;

  notification.icon = options?.icon ?? faker.word.noun();
  notification.title = options?.title ?? faker.lorem.sentence();
  notification.message = options?.message ?? faker.lorem.paragraph();

  notification.active = options?.active ?? faker.date.recent(180);
  notification.expires =
    options?.expires ??
    faker.helpers.maybe(() => faker.date.future(30), { probability: 0.5 }) ??
    null;

  notification.dismissed = options?.dismissed ?? faker.datatype.boolean();

  return notification;
}
