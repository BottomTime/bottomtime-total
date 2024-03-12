import { DiveSiteDTO, SuccinctProfileDTO } from '@bottomtime/api';

import { DiveSiteEntity } from '@/data';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { AnonymousUserProfile, Depth, GpsCoordinates } from '../common';

export type GPSCoordinates = NonNullable<DiveSiteDTO['gps']>;

export type DiveSiteMetadata = {
  rating?: number;
  difficulty?: number;
};

export class DiveSite {
  private readonly log = new Logger(DiveSite.name);

  constructor(
    @InjectRepository(DiveSiteEntity)
    private readonly DiveSites: Repository<DiveSiteEntity>,
    private readonly data: DiveSiteEntity,
    private readonly metadata: DiveSiteMetadata,
  ) {}

  // READ-ONLY METADATA
  get id(): string {
    return this.data.id;
  }

  get createdOn(): Date {
    return this.data.createdOn;
  }

  get updatedOn(): Date | undefined {
    return this.data.updatedOn ?? undefined;
  }

  get creator(): SuccinctProfileDTO {
    if (!this.data.creator) {
      // Populate failed. The user record is missing. This should never happen.
      return AnonymousUserProfile;
    }

    return {
      userId: this.data.creator.id,
      username: this.data.creator.username,
      memberSince: this.data.creator.memberSince,
    };
  }

  get averageRating(): number | undefined {
    return this.metadata.rating ?? undefined;
  }

  get averageDifficulty(): number | undefined {
    return this.metadata.difficulty ?? undefined;
  }

  // BASIC INFO
  get name(): string {
    return this.data.name;
  }
  set name(val: string) {
    this.data.name = val;
  }

  get description(): string | undefined {
    return this.data.description || undefined;
  }
  set description(val: string | undefined) {
    this.data.description = val || null;
  }

  get depth(): Depth | undefined {
    return typeof this.data.depth === 'number' && this.data.depthUnit
      ? {
          depth: this.data.depth,
          unit: this.data.depthUnit,
        }
      : undefined;
  }
  set depth(val: Depth | undefined) {
    if (val) {
      this.data.depth = val.depth;
      this.data.depthUnit = val.unit;
    } else {
      this.data.depth = null;
      this.data.depthUnit = null;
    }
  }

  get freeToDive(): boolean | undefined {
    return this.data.freeToDive ?? undefined;
  }
  set freeToDive(val: boolean | undefined) {
    this.data.freeToDive = typeof val === 'boolean' ? val : null;
  }

  get shoreAccess(): boolean | undefined {
    return this.data.shoreAccess ?? undefined;
  }
  set shoreAccess(val: boolean | undefined) {
    this.data.shoreAccess = typeof val === 'boolean' ? val : null;
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
    this.data.directions = val || null;
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
      this.data.gps = null;
    }
  }

  async save(): Promise<void> {
    await this.DiveSites.save(this.data);
  }

  async delete(): Promise<boolean> {
    const { affected } = await this.DiveSites.delete({ id: this.id });
    return typeof affected === 'number' && affected > 0;
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
