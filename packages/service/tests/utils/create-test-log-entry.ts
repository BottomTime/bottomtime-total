import { DepthUnit } from '@bottomtime/api';

import { faker } from '@faker-js/faker';

import dayjs from 'dayjs';
import { z } from 'zod';

import { DiveSiteEntity, LogEntryEntity, UserEntity } from '../../src/data';

const Timezones = [
  'America/Los_Angeles',
  'America/New_York',
  'Europe/Amsterdam',
  'Asia/Singapore',
  'UTC',
];

const LogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.coerce.date(),
  entryTime: z.string(),
  timezone: z.string(),
  logNumber: z.number().nullable(),
  bottomTime: z.number().nullable(),
  duration: z.number().nullable(),
  maxDepth: z.number().nullable(),
  maxDepthUnit: z.nativeEnum(DepthUnit).nullable(),
  notes: z.string().nullable(),
});

export function createTestLogEntry(
  owner: UserEntity,
  options?: Partial<LogEntryEntity>,
): LogEntryEntity {
  const data = new LogEntryEntity();

  data.owner = owner;

  data.id = options?.id ?? faker.datatype.uuid();
  data.logNumber =
    options?.logNumber ??
    faker.helpers.maybe(() => faker.datatype.number(), { probability: 0.9 }) ??
    null;
  data.owner = owner;

  data.timestamp = options?.timestamp ?? faker.date.past(3);
  data.entryTime =
    options?.entryTime ?? dayjs(data.timestamp).format('YYYY-MM-DDTHH:mm:ss');
  data.timezone = options?.timezone ?? faker.helpers.arrayElement(Timezones);

  data.bottomTime =
    options?.bottomTime ?? faker.datatype.number({ min: 12, max: 95 });
  data.duration = options?.duration ?? Math.ceil(data.bottomTime * 1.1);

  data.maxDepth =
    options?.maxDepth ?? faker.datatype.number({ min: 10, max: 40 });
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
