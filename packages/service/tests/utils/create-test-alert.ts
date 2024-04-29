import { faker } from '@faker-js/faker';

import { z } from 'zod';

import { AlertEntity } from '../../src/data';

const AlertSchema = z.object({
  id: z.string(),
  icon: z.string(),
  title: z.string(),
  message: z.string(),
  active: z.coerce.date(),
  expires: z.coerce.date().nullable(),
});

export function createTestAlert(options?: Partial<AlertEntity>): AlertEntity {
  const alert = new AlertEntity();

  alert.id = options?.id ?? faker.string.uuid();
  alert.icon = options?.icon ?? faker.word.noun();
  alert.title = options?.title ?? faker.lorem.sentence();
  alert.message = options?.message ?? faker.lorem.paragraphs(2);
  alert.active = options?.active ?? faker.date.recent({ days: 60 });
  alert.expires =
    options?.expires ??
    faker.helpers.maybe(() => faker.date.soon({ days: 60 }), {
      probability: 0.75,
    }) ??
    null;

  return alert;
}

export function parseAlertJSON(json: unknown): AlertEntity {
  return AlertSchema.parse(json);
}
