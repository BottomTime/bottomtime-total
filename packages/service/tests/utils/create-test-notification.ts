import { faker } from '@faker-js/faker';

import { z } from 'zod';

import { NotificationEntity, UserEntity } from '../../src/data';

const NotificationSchema = z.object({
  id: z.string().uuid(),
  icon: z.string(),
  title: z.string(),
  message: z.string(),
  active: z.coerce.date(),
  expires: z.coerce.date().nullable().default(null),
  dismissed: z.boolean(),
});

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
    faker.helpers.maybe(() => faker.date.soon(30), { probability: 0.75 }) ??
    null;

  notification.dismissed = options?.dismissed ?? faker.datatype.boolean();

  return notification;
}

export function parseNotificationJSON(
  json: unknown,
  recipient: UserEntity,
): NotificationEntity {
  const notification = {
    ...NotificationSchema.parse(json),
    recipient,
  };
  return notification;
}
