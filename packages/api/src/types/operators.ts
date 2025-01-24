import { z } from 'zod';

import {
  BooleanString,
  GpsCoordinatesSchema,
  PhoneNumber,
  SlugRegex,
  SortOrder,
} from './constants';
import { ProfileSchema, SuccinctProfileSchema, UsernameSchema } from './users';

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

export enum OperatorReviewSortBy {
  Age = 'createdAt',
  Rating = 'rating',
}

export const CreateOrUpdateOperatorSchema = z.object({
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
export type CreateOrUpdateOperatorDTO = z.infer<
  typeof CreateOrUpdateOperatorSchema
>;

export const OperatorSchema = CreateOrUpdateOperatorSchema.extend({
  id: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  averageRating: z.number().optional(),
  owner: SuccinctProfileSchema,
  verificationStatus: z.nativeEnum(VerificationStatus),
  verificationMessage: z.string().optional(),

  logo: z.string().optional(),
  banner: z.string().optional(),
});
export type OperatorDTO = z.infer<typeof OperatorSchema>;

export const SuccinctOperatorSchema = OperatorSchema.pick({
  address: true,
  averageRating: true,
  description: true,
  id: true,
  gps: true,
  logo: true,
  name: true,
  slug: true,
  phone: true,
  website: true,
});
export type SuccinctOperatorDTO = z.infer<typeof SuccinctOperatorSchema>;

export const SearchOperatorsSchema = z
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
export type SearchOperatorsParams = z.infer<typeof SearchOperatorsSchema>;

export const SearchOperatorsResponseSchema = z.object({
  data: OperatorSchema.array(),
  totalCount: z.number().int(),
});

export const VerifyOperatorSchema = z.object({
  verified: z.boolean(),
  message: z.string().max(1000).optional(),
});
export type VerifyOperatorDTO = z.infer<typeof VerifyOperatorSchema>;

export const TransferOperatorOwnershipSchema = z.object({
  newOwner: UsernameSchema,
});
export type TransferOperatorOwnershipDTO = z.infer<
  typeof TransferOperatorOwnershipSchema
>;

export const CreateOrUpdateOperatorReviewSchema = z.object({
  comments: z.string().trim().max(1000).optional(),
  rating: z.number().min(1).max(5),
});
export type CreateOrUpdateOperatorReviewDTO = z.infer<
  typeof CreateOrUpdateOperatorReviewSchema
>;

export const OperatorReviewSchema = CreateOrUpdateOperatorReviewSchema.extend({
  id: z.string().uuid(),
  createdAt: z.number(),
  updatedAt: z.number(),
  creator: SuccinctProfileSchema,
});
export type OperatorReviewDTO = z.infer<typeof OperatorReviewSchema>;

export const ListOperatorReviewsSchema = z
  .object({
    query: z.string().max(200),
    creator: UsernameSchema,
    skip: z.coerce.number().int().min(0),
    limit: z.coerce.number().int().min(1).max(500),
    sortBy: z.nativeEnum(OperatorReviewSortBy),
    sortOrder: z.nativeEnum(SortOrder),
  })
  .partial();
export type ListOperatorReviewsParams = z.infer<
  typeof ListOperatorReviewsSchema
>;

export const ListOperatorDiveSitesParamsSchema = z
  .object({
    skip: z.coerce.number().int().min(0),
    limit: z.coerce.number().int().min(1).max(500),
  })
  .partial();
export type ListOperatorDiveSitesParams = z.infer<
  typeof ListOperatorDiveSitesParamsSchema
>;

export const DiveSiteIdsParamsSchema = z.object({
  siteIds: z.string().uuid().array().min(1).max(500),
});
export type DiveSiteIdsParamsDTO = z.infer<typeof DiveSiteIdsParamsSchema>;

export const AttachDiveSitesResponseSchema = z.object({
  attached: z.number().int(),
  skipped: z.number().int(),
});
export type AttachDiveSitesResponseDTO = z.infer<
  typeof AttachDiveSitesResponseSchema
>;

export const RemoveDiveSitesResponseSchema = z.object({
  removed: z.number().int(),
  skipped: z.number().int(),
});
export type RemoveDiveSitesResponseDTO = z.infer<
  typeof RemoveDiveSitesResponseSchema
>;

export const CreateOrUpdateTeamMemberSchema = z.object({
  title: z.string().trim().max(200).optional(),
  joined: z.number().int().optional(),
});
export type CreateOrUpdateTeamMemberDTO = z.infer<
  typeof CreateOrUpdateTeamMemberSchema
>;

export const TeamMemberSchema = CreateOrUpdateTeamMemberSchema.extend({
  member: ProfileSchema,
});
export type TeamMemberDTO = z.infer<typeof TeamMemberSchema>;
