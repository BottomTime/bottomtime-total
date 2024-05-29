import { DepthUnit } from '@bottomtime/api';

import { faker } from '@faker-js/faker';

import dayjs from 'dayjs';
import 'dayjs/plugin/timezone';
import { z } from 'zod';

import { DiveSiteEntity, LogEntryEntity, UserEntity } from '../../src/data';

const LogEntrySchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable().default(null),
  timestamp: z.coerce.date(),
  entryTime: z.string(),
  timezone: z.string(),
  logNumber: z.number().nullable(),
  bottomTime: z.number().nullable(),
  duration: z.number(),
  maxDepth: z.number().nullable(),
  maxDepthUnit: z.nativeEnum(DepthUnit).nullable(),
  notes: z.string().nullable(),
});

export function createTestLogEntry(
  owner: UserEntity,
  options?: Partial<LogEntryEntity>,
): LogEntryEntity {
  const data = new LogEntryEntity();
  const timezone = options?.timezone ?? faker.location.timeZone();

  data.owner = owner;

  data.id = options?.id ?? faker.string.uuid();
  data.logNumber =
    options?.logNumber ??
    faker.helpers.maybe(() => faker.number.int({ min: 1, max: 999 }), {
      probability: 0.9,
    }) ??
    null;
  data.owner = owner;

  data.timestamp = options?.timestamp ?? faker.date.past({ years: 3 });
  data.entryTime =
    options?.entryTime ??
    dayjs(data.timestamp).tz(timezone, true).format('YYYY-MM-DDTHH:mm:ss');
  data.timezone = timezone;

  data.bottomTime =
    options?.bottomTime ?? faker.number.int({ min: 12, max: 95 });
  data.duration = options?.duration ?? Math.ceil(data.bottomTime * 1.1);

  data.maxDepth =
    options?.maxDepth ??
    faker.number.float({ min: 10, max: 40, multipleOf: 0.01 });
  data.maxDepthUnit =
    options?.maxDepthUnit ??
    faker.helpers.arrayElement(Object.values(DepthUnit));

  data.notes = options?.notes ?? faker.lorem.paragraph();

  return data;
}

export function parseLogEntryJSON(
  data: unknown,
  owner: UserEntity,
  site: DiveSiteEntity | null = null,
): LogEntryEntity {
  const entry = LogEntrySchema.parse(data);
  return {
    ...entry,
    owner,
    site,
  };
}
