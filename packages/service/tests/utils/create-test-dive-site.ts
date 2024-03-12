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
});

export function createTestDiveSite(
  creator: UserEntity,
  options?: Partial<DiveSiteEntity>,
): DiveSiteEntity {
  const name = faker.random.words(2);
  const location = faker.address.city();

  const data = new DiveSiteEntity();

  data.id = options?.id ?? faker.datatype.uuid();
  data.creator = creator;
  data.createdOn = options?.createdOn ?? faker.date.past(1);
  data.updatedOn =
    options?.updatedOn ??
    faker.helpers.maybe(() => faker.date.past(1), { probability: 0.5 }) ??
    null;
  data.name = name;
  data.description = options?.description ?? faker.lorem.paragraph();
  data.depth = options?.depth ?? faker.datatype.number({ min: 10, max: 40 });
  data.depthUnit =
    options?.depthUnit ?? faker.helpers.arrayElement(Object.values(DepthUnit));
  data.location = location;
  data.directions = options?.directions ?? faker.lorem.paragraph();
  data.gps = options?.gps ?? {
    type: 'Point',
    coordinates: [
      parseFloat(faker.address.longitude()),
      parseFloat(faker.address.latitude()),
    ],
  };
  data.shoreAccess =
    options?.shoreAccess ??
    faker.helpers.maybe(() => faker.datatype.boolean(), { probability: 0.8 }) ??
    null;
  data.freeToDive =
    options?.shoreAccess ??
    faker.helpers.maybe(() => faker.datatype.boolean(), { probability: 0.8 }) ??
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
