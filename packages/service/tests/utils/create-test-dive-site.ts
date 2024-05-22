import { DepthUnit } from '@bottomtime/api';

import { faker } from '@faker-js/faker';

import { z } from 'zod';

import { DiveSiteEntity, UserEntity } from '../../src/data';

const DiveSiteSchema = z.object({
  id: z.string(),
  createdOn: z.coerce.date(),
  updatedOn: z.coerce.date().nullable().default(null),
  name: z.string(),
  description: z.string().nullable().default(null),
  depth: z.number().nullable().default(null),
  depthUnit: z.nativeEnum(DepthUnit).nullable().default(null),
  location: z.string(),
  directions: z.string().nullable().default(null),
  gps: z
    .object({
      type: z.literal('Point'),
      coordinates: z.tuple([z.number(), z.number()]),
    })
    .nullable()
    .default(null),
  freeToDive: z.boolean().nullable().default(null),
  shoreAccess: z.boolean().nullable().default(null),

  averageRating: z.number().nullable().default(null),
  averageDifficulty: z.number().nullable().default(null),
});

export function createTestDiveSite(
  creator: UserEntity,
  options?: Partial<DiveSiteEntity>,
): DiveSiteEntity {
  const name =
    options?.name ||
    `${faker.word.adjective()} ${faker.word.adjective()} ${faker.word.noun()}`;
  const location = options?.location || faker.location.city();

  const data = new DiveSiteEntity();

  data.id = options?.id ?? faker.string.uuid();
  data.creator = creator;
  data.createdOn = options?.createdOn ?? faker.date.past({ years: 1 });
  data.updatedOn =
    options?.updatedOn ??
    faker.helpers.maybe(() => faker.date.past({ years: 1 }), {
      probability: 0.5,
    }) ??
    null;
  data.name = name;
  data.description = options?.description ?? faker.lorem.paragraph();
  data.depth =
    options?.depth ??
    faker.number.float({ min: 10, max: 40, multipleOf: 0.01 });
  data.depthUnit =
    options?.depthUnit ?? faker.helpers.arrayElement(Object.values(DepthUnit));
  data.location = location;
  data.directions = options?.directions ?? faker.lorem.paragraph();
  data.gps = options?.gps ?? {
    type: 'Point',
    coordinates: [faker.location.longitude(), faker.location.latitude()],
  };
  data.shoreAccess =
    options?.shoreAccess ??
    faker.helpers.maybe(() => faker.datatype.boolean(), { probability: 0.8 }) ??
    null;
  data.freeToDive =
    options?.freeToDive ??
    faker.helpers.maybe(() => faker.datatype.boolean(), { probability: 0.8 }) ??
    null;

  data.averageRating =
    options?.averageRating ??
    faker.helpers.maybe(
      () => faker.number.float({ min: 1, max: 5, multipleOf: 0.01 }),
      { probability: 0.9 },
    ) ??
    null;
  data.averageDifficulty =
    options?.averageDifficulty ??
    faker.helpers.maybe(
      () => faker.number.float({ min: 1, max: 5, multipleOf: 0.01 }),
      { probability: 0.9 },
    ) ??
    null;

  return data;
}

export function parseDiveSiteJSON(
  json: unknown,
  creator: UserEntity,
): DiveSiteEntity {
  const site = {
    ...DiveSiteSchema.parse(json),
    creator,
  };
  return site;
}
