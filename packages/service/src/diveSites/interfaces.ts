import { GpsCoordinates } from '../common';

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
  readonly creator: string;
  readonly createdOn: Date;
  readonly updatedOn?: Date;
  readonly averageRating: number;

  save(): Promise<void>;
  delete(): Promise<void>;

  toJSON(): Record<string, unknown>;
  toSummaryJSON(): Record<string, unknown>;
}

export interface SearchDiveSitesOptions {
  query?: string;
}

export interface DiveSiteManager {
  createDiveSite(data: DiveSiteData): Promise<DiveSite>;
  getDiveSite(id: string): Promise<DiveSite | undefined>;
  searchDiveSites(options?: SearchDiveSitesOptions): Promise<DiveSite[]>;
}
