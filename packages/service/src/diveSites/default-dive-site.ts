import { Collection, MongoClient, UpdateFilter } from 'mongodb';
import Logger from 'bunyan';

import { Collections, DiveSiteDocument, UserDocument } from '../data';
import { DiveSite, DiveSiteCreator } from './interfaces';
import { GpsCoordinates } from '../common';

class DiveSiteReflection implements DiveSiteDocument {
  _id = '';
  creator = '';
  createdOn = new Date();
  updatedOn = new Date();
  name = '';
  description = '';
  location = '';
  directions = '';
  gps = { type: 'Point', coordinates: [0, 0] } as any;
  freeToDive = true;
  shoreAccess = true;
  averageRating = 0;
  averageDifficulty = 0;
  reviews = [];
}
const DiveSiteKeys: readonly string[] = Object.keys(new DiveSiteReflection());

export class DefaultDiveSite implements DiveSite {
  private readonly sites: Collection<DiveSiteDocument>;
  private readonly users: Collection<UserDocument>;
  private creator: DiveSiteCreator | undefined;

  constructor(
    mongoClient: MongoClient,
    private readonly log: Logger,
    private readonly data: DiveSiteDocument,
    creator?: DiveSiteCreator,
  ) {
    const db = mongoClient.db();
    this.sites = db.collection(Collections.DiveSites);
    this.users = db.collection(Collections.Users);
    this.creator = creator;
  }

  get id(): string {
    return this.data._id;
  }

  get createdOn(): Date {
    return this.data.createdOn;
  }

  get updatedOn(): Date | undefined {
    return this.data.updatedOn;
  }

  get averageRating(): number {
    return this.data.averageRating ?? 0;
  }

  get averageDifficulty(): number {
    return this.data.averageDifficulty ?? 0;
  }

  get name(): string {
    return this.data.name;
  }
  set name(value: string) {
    this.data.name = value;
  }

  get description(): string | undefined {
    return this.data.description;
  }
  set description(value: string | undefined) {
    this.data.description = value;
  }

  get location(): string {
    return this.data.location;
  }
  set location(value: string) {
    this.data.location = value;
  }

  get directions(): string | undefined {
    return this.data.directions;
  }
  set directions(value: string | undefined) {
    this.data.directions = value;
  }

  get gps(): GpsCoordinates | undefined {
    if (this.data.gps) {
      const [lat, lon] = this.data.gps.coordinates;
      return { lat, lon };
    }

    return undefined;
  }
  set gps(value: GpsCoordinates | undefined) {
    this.data.gps = value
      ? {
          type: 'Point',
          coordinates: [value.lat, value.lon],
        }
      : undefined;
  }

  get freeToDive(): boolean | undefined {
    return this.data.freeToDive;
  }
  set freeToDive(value: boolean | undefined) {
    this.data.freeToDive = value;
  }

  get shoreAccess(): boolean | undefined {
    return this.data.shoreAccess;
  }
  set shoreAccess(value: boolean | undefined) {
    this.data.shoreAccess = value;
  }

  async getCreator(): Promise<DiveSiteCreator> {
    if (this.creator) {
      return this.creator;
    }

    this.log.debug(
      `Attempting to fetch creator info for dive site "${this.data._id}"...`,
    );
    const creator = await this.users.findOne(
      { _id: this.data.creator },
      {
        projection: {
          _id: true,
          username: true,
          'profile.name': true,
        },
      },
    );

    if (creator) {
      this.creator = {
        id: creator._id,
        username: creator.username,
        displayName: creator.profile?.name ?? creator.username,
      };
      return this.creator;
    }

    this.log.warn('Orphaned dive stie detected!', {
      diveSite: this.data._id,
      creatorId: this.data.creator,
    });

    // TODO: Need a better solution here. Assign to admin?
    throw new Error(
      'This dive site is orphaned! Creator ID could not be found!',
    );
  }

  async save(): Promise<void> {
    const now = new Date();
    const update: UpdateFilter<DiveSiteDocument> = {
      $set: {},
      $unset: {},
    };
    for (const key of DiveSiteKeys) {
      if (key === 'updatedOn') {
        break;
      } else if (this.data[key] === undefined) {
        update.$unset![key] = true;
      } else {
        update.$set![key] = this.data[key];
      }
    }
    Object.assign(update.$set!, { updatedOn: now });

    this.log.debug(`Saving dive site data for site ${this.data._id}...`);
    await this.sites.updateOne({ _id: this.data._id }, update, {
      upsert: true,
    });
    this.data.updatedOn = now;

    this.log.debug(
      `Dive site data saved successfully for site ${this.data._id}`,
    );
  }

  async delete(): Promise<void> {
    await this.sites.deleteOne({ _id: this.data._id });
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      creator: this.creator,
      createdOn: this.createdOn,
      updatedOn: this.updatedOn,
      averageRating: this.averageRating,
      averageDifficulty: this.averageDifficulty,
      name: this.name,
      description: this.description,
      location: this.location,
      freeToDive: this.freeToDive,
      shoreAccess: this.shoreAccess,
      directions: this.directions,
      gps: this.gps,
    };
  }

  toSummaryJSON(): Record<string, unknown> {
    return {
      id: this.id,
      creator: this.creator,
      createdOn: this.createdOn,
      updatedOn: this.updatedOn,
      averageRating: this.averageRating,
      averageDifficulty: this.averageDifficulty,
      name: this.name,
      location: this.location,
      freeToDive: this.freeToDive,
      shoreAccess: this.shoreAccess,
    };
  }
}
