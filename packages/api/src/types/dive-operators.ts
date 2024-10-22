import { z } from 'zod';

import {
  BooleanString,
  GpsCoordinatesSchema,
  PhoneNumber,
  SlugRegex,
} from './constants';
import { SuccinctProfileSchema, UsernameSchema } from './users';

export enum VerificationStatus {
  /** Verification has not yet been requested for this entity. */
  Unverified = 'unverified',

  /** Entity is verified. */
  Verified = 'verified',

  /** Verification has been requested but not yet approved/disapproved. */
  Pending = 'pending',

  /** Verification has been rejected for this entity pending further action. */
  Rejected = 'rejected',
}

export const CreateOrUpdateDiveOperatorSchema = z.object({
  active: z.boolean(),
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().toLowerCase().regex(SlugRegex).min(1).max(200),
  description: z.string().trim().max(2000),
  address: z.string().trim().max(500),
  phone: PhoneNumber.optional(),
  email: z.string().trim().email().max(100).optional(),
  website: z.string().url().max(200).optional(),

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
      youtube: z.string().max(100),
    })
    .partial()
    .optional(),
});
export type CreateOrUpdateDiveOperatorDTO = z.infer<
  typeof CreateOrUpdateDiveOperatorSchema
>;

export const DiveOperatorSchema = CreateOrUpdateDiveOperatorSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  owner: SuccinctProfileSchema,
  verificationStatus: z.nativeEnum(VerificationStatus),
  verificationMessage: z.string().optional(),

  logo: z.string().optional(),
  banner: z.string().optional(),
});
export type DiveOperatorDTO = z.infer<typeof DiveOperatorSchema>;

export const SearchDiveOperatorsSchema = z
  .object({
    query: z.string().max(200),
    location: GpsCoordinatesSchema,
    radius: z.coerce.number().gt(0).max(500),
    owner: UsernameSchema,
    showInactive: BooleanString,
    verification: z.nativeEnum(VerificationStatus),
    skip: z.coerce.number().int().min(0),
    limit: z.coerce.number().int().min(1).max(500),
  })
  .partial();
export type SearchDiveOperatorsParams = z.infer<
  typeof SearchDiveOperatorsSchema
>;

export const SearchDiveOperatorsResponseSchema = z.object({
  operators: DiveOperatorSchema.array(),
  totalCount: z.number().int(),
});
export type SearchDiveOperatorsResponseDTO = z.infer<
  typeof SearchDiveOperatorsResponseSchema
>;

export const VerifyDiveOperatorSchema = z.object({
  verified: z.boolean(),
  message: z.string().max(1000).optional(),
});
export type VerifyDiveOperatorDTO = z.infer<typeof VerifyDiveOperatorSchema>;

export const TransferDiveOperatorOwnershipSchema = z.object({
  newOwner: UsernameSchema,
});
export type TransferDiveOperatorOwnershipDTO = z.infer<
  typeof TransferDiveOperatorOwnershipSchema
>;
