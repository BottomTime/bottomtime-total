import { WeightDTO, WeightUnit } from '@bottomtime/api';

import { faker } from '@faker-js/faker';

import dayjs from 'dayjs';

import { DiveSiteEntity, LogEntryEntity, UserEntity } from '../../../src/data';
import { fakeDepth } from './fake-depth';
import { possibly } from './possibly';

export function fakeLogEntry(
  userIds: string[],
  siteIds?: string[],
): LogEntryEntity {
  const data = new LogEntryEntity();
  const depth = possibly(fakeDepth, 0.7);
  const entryTime = dayjs(faker.date.past({ years: 3 })).format(
    'YYYY-MM-DDTHH:mm:ss',
  );
  const timezone = faker.location.timeZone();
  const timestamp = dayjs(entryTime).tz(timezone, true).utc().toDate();

  const weight: WeightDTO | null =
    possibly(
      () => ({
        weight: faker.number.float({ min: 0, max: 8, multipleOf: 0.1 }),
        unit: faker.helpers.enumValue(WeightUnit),
      }),
      0.5,
    ) ?? null;

  data.id = faker.string.uuid();
  data.owner = { id: faker.helpers.arrayElement(userIds) } as UserEntity;
  data.logNumber = faker.number.int({ min: 1, max: 1000 });

  data.timestamp = timestamp;
  data.duration = faker.number.float({ min: 20, max: 120, multipleOf: 0.1 });
  data.bottomTime =
    possibly(
      () =>
        data.duration -
        faker.number.float({ min: 3, max: 10, multipleOf: 0.1 }),
      0.8,
    ) ?? null;
  data.entryTime = dayjs(entryTime).format('YYYY-MM-DDTHH:mm:ss');
  data.timezone = timezone;

  data.maxDepth = depth?.depth ?? null;
  data.maxDepthUnit = depth?.unit ?? null;

  data.weight = weight?.weight ?? null;
  data.weightUnit = weight?.unit ?? null;

  data.notes = possibly(() => faker.lorem.paragraph(), 0.85) ?? null;

  data.site = siteIds?.length
    ? ({ id: faker.helpers.arrayElement(siteIds) } as DiveSiteEntity)
    : null;

  return data;
}
