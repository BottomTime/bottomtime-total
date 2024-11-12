import {
  DepthUnit,
  ExposureSuit,
  PressureUnit,
  TankMaterial,
  TemperatureUnit,
  TrimCorrectness,
  WeightCorrectness,
  WeightUnit,
} from '@bottomtime/api';

import { faker } from '@faker-js/faker';

import dayjs from 'dayjs';
import 'dayjs/plugin/timezone';
import { z } from 'zod';

import {
  DiveSiteEntity,
  LogEntryAirEntity,
  LogEntryEntity,
  UserEntity,
} from '../../src/data';

const WeatherConditions = [
  'sunny',
  'cloudy',
  'partly cloudy',
  'rainy',
  'stormy',
];

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
  averageDepth: z.number().nullable(),
  maxDepth: z.number().nullable(),
  depthUnit: z.nativeEnum(DepthUnit).nullable(),
  weight: z.number().nullable(),
  weightUnit: z.nativeEnum(WeightUnit).nullable(),
  weightCorrectness: z.nativeEnum(WeightCorrectness).nullable(),
  trimCorrectness: z.nativeEnum(TrimCorrectness).nullable(),

  exposureSuit: z.nativeEnum(ExposureSuit).nullable(),
  hood: z.boolean().nullable(),
  gloves: z.boolean().nullable(),
  boots: z.boolean().nullable(),
  camera: z.boolean().nullable(),
  torch: z.boolean().nullable(),
  scooter: z.boolean().nullable(),

  airTemperature: z.number().nullable(),
  surfaceTemperature: z.number().nullable(),
  bottomTemperature: z.number().nullable(),
  temperatureUnit: z.nativeEnum(TemperatureUnit).nullable(),
  chop: z.number().nullable(),
  current: z.number().nullable(),
  weather: z.string().nullable(),
  visibility: z.number().nullable(),

  notes: z.string().nullable(),
  tags: z.string().array(),

  air: z
    .object({
      id: z.string(),
      ordinal: z.number().int(),
      name: z.string(),
      material: z.nativeEnum(TankMaterial),
      workingPressure: z.number(),
      volume: z.number(),
      count: z.number().int(),
      startPressure: z.number(),
      endPressure: z.number(),
      pressureUnit: z.nativeEnum(PressureUnit),
      o2Percent: z.number().nullable(),
      hePercent: z.number().nullable(),
    })
    .array()
    .optional(),
});

export function createTestLogEntryAir(
  options?: Partial<LogEntryAirEntity>,
): LogEntryAirEntity {
  const data = new LogEntryAirEntity();

  data.id = options?.id ?? faker.string.uuid();
  data.ordinal = options?.ordinal ?? 0;

  data.name = options?.name ?? `${faker.word.adjective()} ${faker.word.noun()}`;
  data.material =
    options?.material ??
    faker.helpers.arrayElement(Object.values(TankMaterial));
  data.workingPressure =
    options?.workingPressure ??
    faker.helpers.arrayElement([182, 207, 237, 300]);
  data.volume =
    options?.volume ?? faker.helpers.arrayElement([4, 11, 12, 15, 18]);

  data.count = options?.count ?? faker.number.int({ min: 1, max: 2 });
  data.pressureUnit =
    options?.pressureUnit ??
    faker.helpers.arrayElement(Object.values(PressureUnit));
  data.startPressure =
    options?.startPressure ??
    faker.number.float(
      data.pressureUnit === PressureUnit.PSI
        ? { min: 2800, max: 3500, multipleOf: 10 }
        : { min: 190, max: 240 },
    );
  data.endPressure =
    options?.startPressure ??
    faker.number.float(
      data.pressureUnit === PressureUnit.PSI
        ? { min: 480, max: 1300, multipleOf: 10 }
        : { min: 33, max: 76 },
    );

  data.o2Percent =
    options?.o2Percent ??
    faker.helpers.maybe(
      () => faker.number.float({ min: 21, max: 40, multipleOf: 0.1 }),
      { probability: 0.7 },
    ) ??
    null;
  data.hePercent =
    options?.hePercent ??
    faker.helpers.maybe(
      () => faker.number.float({ min: 0, max: 80, multipleOf: 0.1 }),
      { probability: 0.05 },
    ) ??
    null;

  return data;
}

export function createTestLogEntry(
  owner: UserEntity,
  options?: Partial<LogEntryEntity>,
): LogEntryEntity {
  const data = new LogEntryEntity();
  const timezone = options?.timezone ?? faker.location.timeZone();

  data.id = options?.id ?? faker.string.uuid();
  data.createdAt = options?.createdAt ?? faker.date.past({ years: 10 });
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
    options?.bottomTime ?? faker.number.int({ min: 720, max: 5700 });
  data.duration = options?.duration ?? Math.ceil(data.bottomTime * 1.1);

  data.depthUnit = options?.depthUnit ?? faker.helpers.enumValue(DepthUnit);
  data.maxDepth =
    options?.maxDepth ??
    faker.number.float(
      data.depthUnit === DepthUnit.Meters
        ? { min: 6, max: 60, multipleOf: 0.01 }
        : { min: 20, max: 150, multipleOf: 0.1 },
    );
  data.averageDepth =
    options?.averageDepth ??
    faker.helpers.maybe(
      () =>
        data.maxDepth! *
        faker.number.float({ min: 0.5, max: 0.9, multipleOf: 0.1 }),
      { probability: 0.7 },
    ) ??
    null;

  if (options?.air) {
    data.air = options.air;
  } else {
    let airCount = faker.number.int({ min: 1, max: 100 });

    if (airCount > 98) airCount = 3;
    else if (airCount > 90) airCount = 2;
    else airCount = 1;

    data.air = Array.from({ length: airCount }, (_, i) =>
      createTestLogEntryAir({
        ordinal: i,
      }),
    );
  }

  data.weightUnit = options?.weightUnit ?? faker.helpers.enumValue(WeightUnit);
  data.weight =
    options?.weight ??
    faker.helpers.maybe(
      () =>
        faker.number.float(
          data.weightUnit === WeightUnit.Kilograms
            ? { min: 0, max: 12, multipleOf: 0.1 }
            : { min: 0, max: 30, multipleOf: 0.1 },
        ),
      { probability: 0.8 },
    ) ??
    null;
  data.weightCorrectness =
    options?.weightCorrectness ??
    faker.helpers.maybe(() => faker.helpers.enumValue(WeightCorrectness), {
      probability: 0.8,
    }) ??
    null;
  data.trimCorrectness =
    options?.trimCorrectness ??
    faker.helpers.maybe(() => faker.helpers.enumValue(TrimCorrectness), {
      probability: 0.8,
    }) ??
    null;

  data.temperatureUnit =
    options?.temperatureUnit ?? faker.helpers.enumValue(TemperatureUnit);
  data.airTemperature =
    options?.airTemperature ??
    faker.helpers.maybe(
      () =>
        faker.number.float(
          data.temperatureUnit === TemperatureUnit.Celsius
            ? { min: 10, max: 30, multipleOf: 0.1 }
            : { min: 50, max: 90, multipleOf: 0.1 },
        ),
      { probability: 0.85 },
    ) ??
    null;
  data.bottomTemperature =
    options?.bottomTemperature ??
    faker.helpers.maybe(
      () =>
        faker.number.float(
          data.temperatureUnit === TemperatureUnit.Celsius
            ? { min: 1, max: 22, multipleOf: 0.1 }
            : { min: 37, max: 98, multipleOf: 0.1 },
        ),
      { probability: 0.85 },
    ) ??
    null;
  data.surfaceTemperature =
    options?.surfaceTemperature ??
    faker.helpers.maybe(
      () =>
        faker.number.float(
          data.temperatureUnit === TemperatureUnit.Celsius
            ? { min: 8, max: 25, multipleOf: 0.1 }
            : { min: 45, max: 68, multipleOf: 0.1 },
        ),
      { probability: 0.85 },
    ) ??
    null;

  data.exposureSuit =
    options?.exposureSuit ??
    faker.helpers.maybe(() => faker.helpers.enumValue(ExposureSuit), {
      probability: 0.8,
    }) ??
    null;
  data.hood =
    typeof options?.hood === 'boolean'
      ? options.hood
      : faker.helpers.maybe(() => faker.datatype.boolean(), {
          probability: 0.8,
        }) ?? null;
  data.gloves =
    typeof options?.gloves === 'boolean'
      ? options.gloves
      : faker.helpers.maybe(() => faker.datatype.boolean(), {
          probability: 0.8,
        }) ?? null;
  data.boots =
    typeof options?.boots === 'boolean'
      ? options.boots
      : faker.helpers.maybe(() => faker.datatype.boolean(), {
          probability: 0.8,
        }) ?? null;
  data.camera =
    typeof options?.camera === 'boolean'
      ? options.camera
      : faker.helpers.maybe(() => faker.datatype.boolean(), {
          probability: 0.8,
        }) ?? null;
  data.torch =
    typeof options?.torch === 'boolean'
      ? options.torch
      : faker.helpers.maybe(() => faker.datatype.boolean(), {
          probability: 0.8,
        }) ?? null;
  data.scooter =
    typeof options?.scooter === 'boolean'
      ? options.scooter
      : faker.helpers.maybe(() => faker.datatype.boolean(), {
          probability: 0.8,
        }) ?? null;

  data.chop =
    options?.chop ??
    faker.helpers.maybe(
      () => faker.number.float({ min: 1, max: 5, multipleOf: 0.1 }),
      { probability: 0.5 },
    ) ??
    null;
  data.current =
    options?.current ??
    faker.helpers.maybe(
      () => faker.number.float({ min: 1, max: 5, multipleOf: 0.1 }),
      { probability: 0.5 },
    ) ??
    null;
  data.visibility =
    options?.visibility ??
    faker.helpers.maybe(
      () => faker.number.float({ min: 1, max: 5, multipleOf: 0.1 }),
      { probability: 0.5 },
    ) ??
    null;
  data.weather =
    options?.weather ?? faker.helpers.arrayElement(WeatherConditions);

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
    import: null,
  };
}
