import Logger from 'bunyan';
import { Collection, MongoClient } from 'mongodb';
import {
  DiveSite,
  DiveSiteData,
  DiveSiteManager,
  SearchDiveSitesOptions,
} from './interfaces';
import { Collections, DiveSiteDocument, UserDocument } from '../data';
import { DefaultDiveSite } from './default-dive-site';
import { v4 as uuid } from 'uuid';
import { User } from '../users';

export class DefaultDiveSiteManager implements DiveSiteManager {
  private readonly sites: Collection<DiveSiteDocument>;
  private readonly users: Collection<UserDocument>;

  constructor(
    private readonly mongoClient: MongoClient,
    private readonly log: Logger,
  ) {
    const db = mongoClient.db();
    this.sites = db.collection(Collections.DiveSites);
    this.users = db.collection(Collections.Users);
  }

  async createDiveSite(
    options: DiveSiteData,
    creator: User,
  ): Promise<DiveSite> {
    const data: DiveSiteDocument = {
      _id: uuid(),
      creator: creator.id,
      createdOn: new Date(),

      name: options.name,
      description: options.description,

      location: options.location,
      directions: options.directions,
      gps: options.gps
        ? {
            type: 'Point',
            coordinates: [options.gps.lon, options.gps.lat],
          }
        : undefined,

      freeToDive: options.freeToDive,
      shoreAccess: options.shoreAccess,
    };

    const site = new DefaultDiveSite(this.mongoClient, this.log, data, {
      id: creator.id,
      username: creator.username,
      displayName: creator.profile?.name ?? creator.username,
    });
    await site.save();

    return site;
  }

  async getDiveSite(id: string): Promise<DiveSite | undefined> {
    const data = await this.sites.findOne(
      { _id: id },
      {
        projection: { reviews: false },
      },
    );

    if (data) return new DefaultDiveSite(this.mongoClient, this.log, data);
    else return undefined;
  }

  async searchDiveSites(
    options?: SearchDiveSitesOptions | undefined,
  ): Promise<DiveSite[]> {
    const results = await this.sites
      .find()
      .skip(options?.skip ?? 0)
      .limit(options?.limit ?? 50);
    return [];
  }
}
