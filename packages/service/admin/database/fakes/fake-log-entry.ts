import {
  DepthUnit,
  ExposureSuit,
  TemperatureUnit,
  TrimCorrectness,
  WeightCorrectness,
  WeightUnit,
} from '@bottomtime/api';

import { faker } from '@faker-js/faker';

import dayjs from 'dayjs';

import { DiveSiteEntity, LogEntryEntity, UserEntity } from '../../../src/data';
import { possibly } from './possibly';

const WeatherConditions = [
  'sunny',
  'cloudy',
  'partly cloudy',
  'rainy',
  'stormy',
];

export function fakeLogEntry(
  userIds: string[],
  siteIds?: string[],
): LogEntryEntity {
  const data = new LogEntryEntity();
  const entryTime = dayjs(faker.date.past({ years: 3 })).format(
    'YYYY-MM-DDTHH:mm:ss',
  );
  const timezone = faker.location.timeZone();
  const timestamp = dayjs(entryTime).tz(timezone, true).utc().toDate();

  data.id = faker.string.uuid();
  data.createdAt = faker.date.past({ years: 10 });
  data.logNumber = faker.number.int({ min: 1, max: 1000 });
  data.owner = { id: faker.helpers.arrayElement(userIds) } as UserEntity;

  data.timestamp = timestamp;
  data.entryTime = dayjs(entryTime).format('YYYY-MM-DDTHH:mm:ss');
  data.timezone = timezone;
  data.duration = faker.number.float({ min: 1200, max: 7200, multipleOf: 0.1 }); // 20mins - 2hrs
  data.bottomTime =
    possibly(
      () =>
        data.duration -
        faker.number.float({ min: 3, max: 10, multipleOf: 0.1 }),
      0.8,
    ) ?? null;

  data.site = siteIds?.length
    ? ({ id: faker.helpers.arrayElement(siteIds) } as DiveSiteEntity)
    : null;

  data.depthUnit = faker.helpers.enumValue(DepthUnit);
  data.maxDepth = faker.number.float(
    data.depthUnit === DepthUnit.Meters
      ? { min: 6, max: 60, multipleOf: 0.01 }
      : { min: 20, max: 150, multipleOf: 0.1 },
  );
  data.averageDepth =
    possibly(
      () =>
        data.maxDepth! *
        faker.number.float({ min: 0.5, max: 0.9, multipleOf: 0.01 }),
      0.7,
    ) ?? null;

  data.weightUnit = faker.helpers.enumValue(WeightUnit);
  data.weight =
    possibly(
      () =>
        faker.number.float(
          data.weightUnit === WeightUnit.Kilograms
            ? { min: 0, max: 12, multipleOf: 0.1 }
            : { min: 0, max: 30, multipleOf: 0.1 },
        ),
      0.7,
    ) ?? null;
  data.weightCorrectness = faker.helpers.enumValue(WeightCorrectness);
  data.trimCorrectness = faker.helpers.enumValue(TrimCorrectness);

  data.exposureSuit = faker.helpers.enumValue(ExposureSuit);
  data.hood = faker.datatype.boolean();
  data.gloves = faker.datatype.boolean();
  data.boots = faker.datatype.boolean();
  data.camera = faker.datatype.boolean();
  data.torch = faker.datatype.boolean();
  data.scooter = faker.datatype.boolean();

  data.temperatureUnit = faker.helpers.enumValue(TemperatureUnit);
  data.airTemperature =
    possibly(
      () =>
        faker.number.float(
          data.temperatureUnit === TemperatureUnit.Celsius
            ? { min: 10, max: 30, multipleOf: 0.1 }
            : { min: 50, max: 90, multipleOf: 0.1 },
        ),
      0.65,
    ) ?? null;
  data.bottomTemperature =
    possibly(
      () =>
        faker.number.float(
          data.temperatureUnit === TemperatureUnit.Celsius
            ? { min: 1, max: 22, multipleOf: 0.1 }
            : { min: 37, max: 98, multipleOf: 0.1 },
        ),
      0.65,
    ) ?? null;
  data.surfaceTemperature =
    possibly(
      () =>
        faker.number.float(
          data.temperatureUnit === TemperatureUnit.Celsius
            ? { min: 8, max: 25, multipleOf: 0.1 }
            : { min: 45, max: 68, multipleOf: 0.1 },
        ),
      0.65,
    ) ?? null;

  data.chop =
    possibly(
      () => faker.number.float({ min: 1, max: 5, multipleOf: 0.1 }),
      0.5,
    ) ?? null;
  data.current =
    possibly(
      () => faker.number.float({ min: 1, max: 5, multipleOf: 0.1 }),
      0.5,
    ) ?? null;
  data.visibility =
    possibly(
      () => faker.number.float({ min: 1, max: 5, multipleOf: 0.1 }),
      0.5,
    ) ?? null;
  data.weather = faker.helpers.arrayElement(WeatherConditions);

  data.notes = possibly(() => faker.lorem.paragraph(), 0.85) ?? null;

  return data;
}
