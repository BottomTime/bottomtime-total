import { z } from 'zod';

import { GpsCoordinatesSchema } from './constants';
import { SuccinctProfileSchema } from './users';

export const CreateOrUpdateDiveOperatorSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().email().max(100).optional(),
  website: z.string().url().max(200).optional(),

  logo: z.string().url().max(200).optional(),
  banner: z.string().url().max(200).optional(),

  gps: z
    .object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
    })
    .optional(),

  socials: z
    .object({
      facebook: z.string().max(100),
      twitter: z.string().max(100),
      instagram: z.string().max(100),
      tiktok: z.string().max(100),
    })
    .partial(),
});
export type CreateOrUpdateDiveOperatorDTO = z.infer<
  typeof CreateOrUpdateDiveOperatorSchema
>;

export const DiveOperatorSchema = CreateOrUpdateDiveOperatorSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  owner: SuccinctProfileSchema,
});
export type DiveOperatorDTO = z.infer<typeof DiveOperatorSchema>;

const SuccinctDiveOperatorSchema = DiveOperatorSchema.pick({
  id: true,
  address: true,
  description: true,
  email: true,
  gps: true,
  logo: true,
  name: true,
  phone: true,
  socials: true,
  website: true,
});
export type SuccinctDiveOperatorDTO = z.infer<
  typeof SuccinctDiveOperatorSchema
>;

export const SearchDiveOperatorsSchema = z
  .object({
    query: z.string().max(200),
    location: GpsCoordinatesSchema,
    radius: z.coerce.number().gt(0).max(500),
    skip: z.coerce.number().int().min(0),
    limit: z.coerce.number().int().min(1).max(500),
  })
  .partial();
export type SearchDiveOperatorsParams = z.infer<
  typeof SearchDiveOperatorsSchema
>;
