import { Depth } from '@/constants';

export interface DiveSiteCreator {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
}

export interface DiveSiteData {
  readonly id: string;
  readonly createdOn: Date;
  readonly updatedOn?: Date;
  readonly creator: DiveSiteCreator;
  readonly averageRating: number;
  readonly averageDifficulty: number;

  name: string;
  description?: string;
  depth?: Depth;
  location: string;
  directions?: string;
  gps?: {
    lat: number;
    lon: number;
  };
  freeToDive?: boolean;
  shoreAccess?: boolean;
}

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
