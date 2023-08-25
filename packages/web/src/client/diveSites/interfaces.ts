import { DepthSchema, GpsCoordinatesSchema, SortOrder } from '@/constants';
import { getRangeSchema } from '@/helpers';
import { z } from 'zod';

const RatingRangeSchema = getRangeSchema(1, 5);

export enum DiveSitesSortBy {
  Name = 'name',
  Rating = 'rating',
}

export const DiveSiteCreatorSchema = z.object({
  avatar: z.string().optional(),
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  memberSince: z.coerce.date(),
});
export type DiveSiteCreator = z.infer<typeof DiveSiteCreatorSchema>;

export const DiveSiteMetadataSchema = z.object({
  id: z.string(),
  createdOn: z.coerce.date(),
  updatedOn: z.coerce.date().optional(),
  creator: DiveSiteCreatorSchema,
  averageRating: z.number(),
  averageDifficulty: z.number(),
});
export type DiveSiteMetadata = z.infer<typeof DiveSiteMetadataSchema>;

export const DiveSiteDataSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  depth: DepthSchema.optional(),
  location: z.string(),
  directions: z.string().optional(),
  gps: GpsCoordinatesSchema.optional(),
  freeToDive: z.boolean().optional(),
  shoreAccess: z.boolean().optional(),
});
export const DiveSiteFullSchema = z.intersection(
  DiveSiteMetadataSchema,
  DiveSiteDataSchema,
);
export type CreateDiveSiteData = z.infer<typeof DiveSiteDataSchema>;
export type DiveSiteData = Readonly<DiveSiteMetadata> & CreateDiveSiteData;

export interface DiveSite extends DiveSiteData {
  readonly isDirty: boolean;
  readonly isDeleted: boolean;
  save(): Promise<void>;
  delete(): Promise<void>;
}

export const SearchDiveSitesOptionsSchema = z
  .object({
    query: z.string(),
    location: z.object({
      lat: z.number(),
      lon: z.number(),
    }),
    radius: z.number(),
    freeToDive: z.boolean(),
    shoreAccess: z.boolean(),
    rating: RatingRangeSchema,
    difficulty: RatingRangeSchema,
    creator: z.string(),
    sortBy: z.nativeEnum(DiveSitesSortBy),
    sortOrder: z.nativeEnum(SortOrder),
    skip: z.number(),
    limit: z.number(),
  })
  .partial();
export type SearchDiveSitesOptions = z.infer<
  typeof SearchDiveSitesOptionsSchema
>;

export interface DiveSiteManager {
  createDiveSite(data: CreateDiveSiteData): Promise<DiveSite>;
  getDiveSite(id: string): Promise<DiveSite>;
  searchDiveSites(options?: SearchDiveSitesOptions): Promise<DiveSite[]>;
}
