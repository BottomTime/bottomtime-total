import { VerificationStatus } from '@bottomtime/api';

import { faker } from '@faker-js/faker';

import slugify from 'slugify';
import { z } from 'zod';

import { OperatorEntity, UserEntity } from '../../src/data';

const OperatorSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().default(null),

  name: z.string(),
  slug: z.string(),
  verificationStatus: z.nativeEnum(VerificationStatus),
  verificationMessage: z.string().nullable().default(null),
  description: z.string().nullable(),
  active: z.boolean().default(true),
  averageRating: z.number().nullable().default(null),

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
  youtube: z.string().nullable(),

  logo: z.string().nullable(),
  banner: z.string().nullable(),
});

export function createTestOperator(
  owner?: UserEntity,
  options?: Partial<OperatorEntity>,
): OperatorEntity {
  const name =
    options?.name ||
    `${faker.word.adjective()}, ${faker.word.adjective()} ${faker.word.noun()}`;
  const operator: OperatorEntity = {
    id: options?.id ?? faker.string.uuid(),
    averageRating: options?.averageRating ?? null,
    createdAt: options?.createdAt ?? faker.date.past({ years: 5 }),
    updatedAt: options?.updatedAt ?? faker.date.recent({ days: 180 }),
    deletedAt: options?.deletedAt ?? null,
    owner,
    active:
      typeof options?.active === 'boolean'
        ? options.active
        : faker.helpers.maybe(() => true, { probability: 0.95 }) ?? false,

    name,
    slug: options?.slug ?? slugify(name),
    verificationStatus:
      options?.verificationStatus ??
      faker.helpers.enumValue(VerificationStatus),
    verificationMessage: options?.verificationMessage ?? null,
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
    youtube: options?.youtube ?? faker.internet.userName(),

    logo: options?.logo ?? faker.image.url({ width: 128, height: 128 }),
    banner: options?.banner ?? faker.image.url({ width: 1024, height: 256 }),
  };

  return operator;
}

export function parseOperatorJSON(
  data: unknown,
  owner?: UserEntity,
): OperatorEntity {
  const operator: OperatorEntity = OperatorSchema.parse(data);
  operator.owner ??= owner;
  return operator;
}
