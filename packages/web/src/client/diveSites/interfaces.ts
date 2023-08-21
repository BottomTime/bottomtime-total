import { Depth, DepthSchema, GpsCoordinatesSchema } from '@/constants';
import { z } from 'zod';

export const DiveSiteCreatorSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
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
export type DiveSiteData = Readonly<DiveSiteMetadata> &
  z.infer<typeof DiveSiteDataSchema>;

export interface DiveSite extends DiveSiteData {
  readonly isDirty: boolean;
  readonly isDeleted: boolean;
  save(): Promise<void>;
  delete(): Promise<void>;
}

export interface DiveSiteSearchOptions {
  query?: string;
  location?: {
    lon: number;
    lat: number;
  };
  radius?: number;
  freeToDive?: boolean;
  shoreAccess?: boolean;
  rating?: Range;
  difficulty?: Range;
  creator?: string;
  sortBy?: string;
  sortOrder?: string;
  skip?: number;
  limit?: number;
}

export interface DiveSiteManager {
  getDiveSite(id: string): Promise<DiveSite>;
  searchDiveSites(options?: DiveSiteSearchOptions): Promise<DiveSite[]>;
}
