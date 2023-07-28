import { GpsCoordinates, Range } from '../common';
import { User } from '../users';

export const DiveSitesSortBy = {
  Name: 'name',
  Rating: 'rating',
} as const;

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

export interface SearchDiveSitesOptions {
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
  createDiveSite(data: DiveSiteData, creator: User): Promise<DiveSite>;
  getDiveSite(id: string): Promise<DiveSite | undefined>;
  searchDiveSites(options?: SearchDiveSitesOptions): Promise<DiveSite[]>;
}
