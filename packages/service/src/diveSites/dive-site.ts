import { DiveSiteDTO, SuccinctProfileDTO } from '@bottomtime/api';

import { Logger } from '@nestjs/common';

import { Model } from 'mongoose';

import { AnonymousUserProfile, Depth, GpsCoordinates } from '../common';
import { UserData } from '../schemas';
import { DiveSiteData, DiveSiteDocument } from '../schemas/dive-sites.document';

export type GPSCoordinates = NonNullable<DiveSiteDTO['gps']>;
export type PopulatedDiveSiteDocument = Omit<DiveSiteDocument, 'creator'> & {
  creator:
    | Pick<UserData, '_id' | 'username' | 'memberSince' | 'profile'>
    | string;
};

export class DiveSite {
  private readonly log = new Logger(DiveSite.name);

  constructor(
    private readonly diveSites: Model<DiveSiteData>,
    private readonly data: PopulatedDiveSiteDocument,
  ) {}

  // READ-ONLY METADATA
  get id(): string {
    return this.data._id;
  }

  get createdOn(): Date {
    return this.data.createdOn;
  }

  get updatedOn(): Date | undefined {
    return this.data.updatedOn ?? undefined;
  }

  get creator(): SuccinctProfileDTO {
    if (typeof this.data.creator === 'string') {
      throw new Error(`DiveSite.creator is not populated ${this.data.creator}`);
    }

    if (!this.data.creator) {
      // Populate failed. The user record is missing. This should never happen.
      return AnonymousUserProfile;
    }

    return {
      userId: this.data.creator._id,
      username: this.data.creator.username,
      memberSince: this.data.creator.memberSince,
    };
  }

  get averageRating(): number | undefined {
    return this.data.averageRating ?? undefined;
  }

  get averageDifficulty(): number | undefined {
    return this.data.averageDifficulty ?? undefined;
  }

  // BASIC INFO
  get name(): string {
    return this.data.name;
  }
  set name(val: string) {
    this.data.name = val;
  }

  get description(): string | undefined {
    return this.data.description ?? undefined;
  }
  set description(val: string | undefined) {
    this.data.description = val;
  }

  get depth(): Depth | undefined {
    return this.data.depth
      ? {
          depth: this.data.depth.depth,
          unit: this.data.depth.unit,
        }
      : undefined;
  }
  set depth(val: Depth | undefined) {
    this.data.depth = val;
  }

  get freeToDive(): boolean | undefined {
    return this.data.freeToDive ?? undefined;
  }
  set freeToDive(val: boolean | undefined) {
    this.data.freeToDive = val;
  }

  get shoreAccess(): boolean | undefined {
    return this.data.shoreAccess ?? undefined;
  }
  set shoreAccess(val: boolean | undefined) {
    this.data.shoreAccess = val;
  }

  // LOCATION INFO
  get location(): string {
    return this.data.location;
  }
  set location(val: string) {
    this.data.location = val;
  }

  get directions(): string | undefined {
    return this.data.directions ?? undefined;
  }
  set directions(val: string | undefined) {
    this.data.directions = val;
  }

  get gps(): GpsCoordinates | undefined {
    if (this.data.gps) {
      return {
        lon: this.data.gps.coordinates[0],
        lat: this.data.gps.coordinates[1],
      };
    }

    return undefined;
  }
  set gps(val: GpsCoordinates | undefined) {
    if (val) {
      this.data.gps = {
        type: 'Point',
        coordinates: [val.lon, val.lat],
      };
    } else {
      this.data.gps = val;
    }
  }

  async save(): Promise<void> {
    if (!this.data.isNew) {
      this.data.updatedOn = new Date();
    }
    await this.data.save();
  }

  async delete(): Promise<boolean> {
    const { deletedCount } = await this.data.deleteOne();
    return deletedCount > 0;
  }

  toJSON(): DiveSiteDTO {
    return {
      id: this.id,
      creator: this.creator,
      createdOn: this.createdOn,
      updatedOn: this.updatedOn,
      name: this.name,
      description: this.description,
      depth: this.depth,
      location: this.location,
      directions: this.directions,
      gps: this.gps,
      freeToDive: this.freeToDive,
      shoreAccess: this.shoreAccess,
      averageRating: this.averageRating,
      averageDifficulty: this.averageDifficulty,
    };
  }
}
