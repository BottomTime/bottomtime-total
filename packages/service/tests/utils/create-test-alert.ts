import { faker } from '@faker-js/faker';

import { AlertEntity } from '../../src/data';

export function createTestAlert(options?: Partial<AlertEntity>): AlertEntity {
  const alert = new AlertEntity();

  alert.id = options?.id ?? faker.datatype.uuid();
  alert.icon = options?.icon ?? faker.random.word();
  alert.title = options?.title ?? faker.lorem.sentence();
  alert.message = options?.message ?? faker.lorem.paragraphs(2);
  alert.active = options?.active ?? faker.date.recent(60);
  alert.expires =
    options?.expires ??
    faker.helpers.maybe(() => faker.date.soon(60), { probability: 0.75 }) ??
    null;

  return alert;
}
