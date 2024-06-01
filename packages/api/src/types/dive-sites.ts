import { z } from 'zod';

import {
  BooleanString,
  DepthSchema,
  GpsCoordinatesSchema,
  RatingRangeSchema,
  SortOrder,
} from './constants';
import { ProfileSchema, UsernameSchema } from './users';

export enum WaterType {
  Salt = 'salt',
  Fresh = 'fresh',
  Mixed = 'mixed',
}

export enum DiveSitesSortBy {
  Name = 'name',
  Rating = 'rating',
}

export enum DiveSiteReviewsSortBy {
  Rating = 'rating',
  CreatedOn = 'createdOn',
}

export const CreateOrUpdateDiveSiteReviewSchema = z.object({
  title: z.string().trim().min(1).max(200),
  rating: z.number().min(1).max(5),
  difficulty: z.number().min(1).max(5).optional(),
  comments: z.string().trim().max(1000).optional(),
});
export type CreateOrUpdateDiveSiteReviewDTO = z.infer<
  typeof CreateOrUpdateDiveSiteReviewSchema
>;

export const DiveSiteReviewSchema = CreateOrUpdateDiveSiteReviewSchema.extend({
  id: z.string().uuid(),
  creator: ProfileSchema,
  createdOn: z.coerce.date(),
  updatedOn: z.coerce.date().optional(),
});
export type DiveSiteReviewDTO = z.infer<typeof DiveSiteReviewSchema>;

export const ListDiveSiteReviewsParamsSchema = z.object({
  sortBy: z
    .nativeEnum(DiveSiteReviewsSortBy)
    .optional()
    .default(DiveSiteReviewsSortBy.Rating),
  sortOrder: z.nativeEnum(SortOrder).optional().default(SortOrder.Descending),
  skip: z.coerce.number().int().min(0).optional().default(0),
  limit: z.coerce.number().int().gt(0).max(200).optional().default(50),
});
export type ListDiveSiteReviewsParamsDTO = z.infer<
  typeof ListDiveSiteReviewsParamsSchema
>;

export const ListDiveSiteReviewsResponseSchema = z.object({
  reviews: z.array(DiveSiteReviewSchema),
  totalCount: z.number().int(),
});
export type ListDiveSiteReviewsResponseDTO = z.infer<
  typeof ListDiveSiteReviewsResponseSchema
>;

export const CreateOrUpdateDiveSiteSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  depth: DepthSchema.optional(),

  location: z.string().trim().min(1).max(200),
  directions: z.string().trim().max(500).optional(),
  gps: z
    .object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
    })
    .optional(),

  freeToDive: z.boolean().optional(),
  shoreAccess: z.boolean().optional(),
  waterType: z.nativeEnum(WaterType).optional(),
});
export type CreateOrUpdateDiveSiteDTO = z.infer<
  typeof CreateOrUpdateDiveSiteSchema
>;

export const DiveSiteSchema = CreateOrUpdateDiveSiteSchema.extend({
  id: z.string().uuid(),
  creator: ProfileSchema,
  createdOn: z.coerce.date(),
  updatedOn: z.coerce.date().optional(),
  averageRating: z.number().min(1).max(5).optional(),
  averageDifficulty: z.number().min(1).max(5).optional(),
});
export type DiveSiteDTO = z.infer<typeof DiveSiteSchema>;

export const SearchDiveSitesParamsSchema = z
  .object({
    query: z.string().trim().max(200),
    location: GpsCoordinatesSchema,
    radius: z.coerce.number().gt(0).max(500).default(50),
    freeToDive: BooleanString,
    shoreAccess: BooleanString,
    waterType: z.nativeEnum(WaterType),
    rating: RatingRangeSchema,
    difficulty: RatingRangeSchema,
    creator: UsernameSchema,
    sortBy: z.nativeEnum(DiveSitesSortBy).default(DiveSitesSortBy.Rating),
    sortOrder: z.nativeEnum(SortOrder).default(SortOrder.Descending),
    skip: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().gt(0).max(500).default(50),
  })
  .partial();
export type SearchDiveSitesParamsDTO = z.infer<
  typeof SearchDiveSitesParamsSchema
>;

export const SearchDiveSitesResponseSchema = z.object({
  sites: z.array(DiveSiteSchema),
  totalCount: z.number().int(),
});
export type SearchDiveSitesResponseDTO = z.infer<
  typeof SearchDiveSitesResponseSchema
>;
