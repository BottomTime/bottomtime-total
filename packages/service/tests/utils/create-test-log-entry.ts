import { DepthUnit, PressureUnit, TankMaterial } from '@bottomtime/api';

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
