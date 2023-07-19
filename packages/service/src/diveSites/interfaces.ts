import { GpsCoordinates } from '../common';

export const DiveSitesSortBy = {} as const;

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
  location?: string;
  radius?: number;
  freeToDive?: boolean;
  shoreAccess?: boolean;
  sortBy?: string;
  sortOrder?: string;
  skip?: number;
  limit?: number;
}

export interface DiveSiteManager {
  createDiveSite(data: DiveSiteData): Promise<DiveSite>;
  getDiveSite(id: string): Promise<DiveSite | undefined>;
  searchDiveSites(options?: SearchDiveSitesOptions): Promise<DiveSite[]>;
}
