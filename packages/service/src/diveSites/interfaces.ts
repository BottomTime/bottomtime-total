import { z } from 'zod';
import { GpsCoordinates } from '../common';
import { SortOrder } from '../constants';
import { User } from '../users';
import { UsernameSchema } from '../data';

export enum DiveSitesSortBy {
  Name = 'name',
  Rating = 'rating',
}

const RangeSchema = z
  .object({
    min: z.number().min(1).max(5),
    max: z.number().max(5),
  })
  .refine((range) => range.max >= range.min, {
    path: ['max'],
    message: 'Maximum cannot be less than the minimum.',
  });

export const SearchDiveSitesSchema = z
  .object({
    query: z.string().trim().max(200),
    location: z.object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
    }),
    radius: z.number().gt(0).max(500).default(50),
    freeToDive: z.boolean(),
    shoreAccess: z.boolean(),
    rating: RangeSchema,
    difficulty: RangeSchema,
    creator: UsernameSchema,
    sortBy: z.nativeEnum(DiveSitesSortBy),
    sortOrder: z.nativeEnum(SortOrder),
    skip: z.number().int().min(0).default(0),
    limit: z.number().int().gt(0).max(500).default(50),
  })
  .partial();
export type SearchDiveSitesOptions = z.infer<typeof SearchDiveSitesSchema>;

export interface DiveSiteCreator {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
}

export interface DiveSiteData {
  name: string;
  description?: string;

  location: string;
  directions?: string;
  gps?: GpsCoordinates;

  freeToDive?: boolean;
  shoreAccess?: boolean;
}

export interface DiveSite extends DiveSiteData {
  readonly id: string;
  readonly createdOn: Date;
  readonly updatedOn?: Date;
  readonly averageRating: number;
  readonly averageDifficulty: number;

  getCreator(): Promise<DiveSiteCreator>;

  save(): Promise<void>;
  delete(): Promise<void>;

  toJSON(): Record<string, unknown>;
  toSummaryJSON(): Record<string, unknown>;
}

export interface DiveSiteManager {
  createDiveSite(data: DiveSiteData, creator: User): Promise<DiveSite>;
  getDiveSite(id: string): Promise<DiveSite | undefined>;
  searchDiveSites(options?: SearchDiveSitesOptions): Promise<DiveSite[]>;
}
