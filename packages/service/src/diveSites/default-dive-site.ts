import { Collection, MongoClient } from 'mongodb';
import Logger from 'bunyan';

import { Collections, DiveSiteDocument } from '../data';
import { DiveSite } from './interfaces';
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
  reviews = [];
}
const DiveSiteKeys: readonly string[] = Object.keys(new DiveSiteReflection());

export class DefaultDiveSite implements DiveSite {
  private readonly sites: Collection<DiveSiteDocument>;

  constructor(
    mongoClient: MongoClient,
    private readonly log: Logger,
    private readonly data: DiveSiteDocument,
  ) {
    this.sites = mongoClient.db().collection(Collections.DiveSites);
  }

  get id(): string {
    return this.data._id;
  }

  get creator(): string {
    // TODO: Nope.
    return this.data.creator;
  }

  get createdOn(): Date {
    return this.data.createdOn;
  }

  get updatedOn(): Date | undefined {
    return this.data.updatedOn;
  }

  get averageRating(): number {
    return this.data.averageRating;
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

  async save(): Promise<void> {
    const update = {
      $set: {},
      $unset: {},
    };
    for (const key of DiveSiteKeys) {
      if (this.data[key] === undefined) {
        Object.assign(update.$unset, { [key]: true });
      } else {
        Object.assign(update.$set, { [key]: this.data[key] });
      }
    }
    this.log.debug(`Saving dive site data for site ${this.data._id}...`);
    await this.sites.updateOne({ _id: this.data._id }, update, {
      upsert: true,
    });
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
      creator: 'Brad77',
      createdOn: this.createdOn,
      updatedOn: this.updatedOn,
      averageRating: this.averageRating,
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
      creator: 'Brad77',
      createdOn: this.createdOn,
      updatedOn: this.updatedOn,
      averageRating: this.averageRating,
      name: this.name,
      description: this.description,
      location: this.location,
      freeToDive: this.freeToDive,
      shoreAccess: this.shoreAccess,
    };
  }
}
