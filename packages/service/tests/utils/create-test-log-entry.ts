import { DepthUnit } from '@bottomtime/api';

import { faker } from '@faker-js/faker';

import dayjs from 'dayjs';

import { LogEntryEntity, UserEntity } from '../../src/data';

const Timezones = ['America/Los_Angeles', 'America/New_York', 'UTC'];

export function createTestLogEntry(
  creator: UserEntity,
  options?: Partial<LogEntryEntity>,
): LogEntryEntity {
  const data = new LogEntryEntity();

  data.creator = creator;

  data.id = options?.id ?? faker.datatype.uuid();
  data.logNumber =
    options?.logNumber ??
    faker.helpers.maybe(() => faker.datatype.number(), { probability: 0.9 });
  data.creator = creator;

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

  return data;
}
