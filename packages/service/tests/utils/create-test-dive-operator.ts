import { faker } from '@faker-js/faker';

import { z } from 'zod';

import { DiveOperatorEntity, UserEntity } from '../../src/data';

const OperatorSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),

  name: z.string(),
  description: z.string().nullable(),

  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),

  gps: z
    .object({
      type: z.literal('Point'),
      coordinates: z.tuple([z.number(), z.number()]),
    })
    .nullable(),

  facebook: z.string().nullable(),
  instagram: z.string().nullable(),
  tiktok: z.string().nullable(),
  twitter: z.string().nullable(),

  logo: z.string().nullable(),
  banner: z.string().nullable(),
});

export function createTestDiveOperator(
  owner?: UserEntity,
  options?: Partial<DiveOperatorEntity>,
): DiveOperatorEntity {
  const operator: DiveOperatorEntity = {
    id: options?.id ?? faker.string.uuid(),
    createdAt: options?.createdAt ?? faker.date.past({ years: 5 }),
    updatedAt: options?.updatedAt ?? faker.date.recent({ days: 180 }),
    owner,

    name: options?.name ?? faker.company.name(),
    description: options?.description ?? faker.lorem.paragraphs(2),

    address:
      options?.address ??
      `${faker.location.streetAddress({
        useFullAddress: true,
      })}, ${faker.location.city()}, ${faker.location.state({
        abbreviated: true,
      })}, ${faker.location.zipCode()}`,
    phone: options?.phone ?? faker.phone.number(),
    email: options?.email ?? faker.internet.email(),
    website: options?.website ?? faker.internet.url(),

    gps: options?.gps ?? {
      type: 'Point',
      coordinates: [faker.location.longitude(), faker.location.latitude()],
    },

    facebook: options?.facebook ?? faker.internet.userName(),
    instagram: options?.instagram ?? faker.internet.userName(),
    tiktok: options?.tiktok ?? faker.internet.userName(),
    twitter: options?.twitter ?? faker.internet.userName(),

    logo: options?.logo ?? faker.image.url({ width: 128, height: 128 }),
    banner: options?.banner ?? faker.image.url({ width: 1024, height: 256 }),
  };

  return operator;
}

export function parseOperatorJSON(data: unknown): DiveOperatorEntity {
  return OperatorSchema.parse(data);
}
