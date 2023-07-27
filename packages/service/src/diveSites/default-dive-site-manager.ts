import Logger from 'bunyan';
import { Collection, Filter, FindOptions, MongoClient } from 'mongodb';
import {
  DiveSite,
  DiveSiteCreator,
  DiveSiteData,
  DiveSiteManager,
  DiveSitesSortBy,
  SearchDiveSitesOptions,
} from './interfaces';
import { Collections, DiveSiteDocument, UserDocument } from '../data';
import { DefaultDiveSite } from './default-dive-site';
import { v4 as uuid } from 'uuid';
import { User } from '../users';
import { SortOrder } from '../constants';
import { assertValid } from '../helpers/validation';
import { SearchDiveSitesSchema } from './validation';

const EquatorialRadiusOfEarthInKm = 6378.137;
type DiveSiteCreatorTable = { [creatorId: string]: DiveSiteCreator };

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
    if (options) {
      options = assertValid(options, SearchDiveSitesSchema).parsed;
    }

    const searchFilter: Filter<DiveSiteDocument> = {};
    const searchOptions: FindOptions<Document> = {
      skip: options?.skip ?? 0,
      limit: options?.limit ?? 50,
    };
    let singleCreator: DiveSiteCreator | undefined = undefined;

    if (options?.query) {
      searchFilter.$text = {
        $search: options.query,
        $language: 'en',
        $caseSensitive: false,
        $diacriticSensitive: false,
      };
    } else if (options?.sortBy || options?.sortOrder) {
      const sortDirection = options.sortOrder === SortOrder.Descending ? -1 : 1;
      searchOptions.sort =
        options?.sortBy === DiveSitesSortBy.Rating
          ? ['averageRating', sortDirection]
          : ['name', sortDirection];
    }

    if (options?.shoreAccess !== undefined) {
      searchFilter.shoreAccess = options.shoreAccess;
    }

    if (options?.freeToDive !== undefined) {
      searchFilter.freeToDive = options.freeToDive;
    }

    if (options?.location) {
      searchFilter.gps = {
        $geoWithin: {
          $centerSphere: [
            [options.location.lon, options.location.lat],
            (options.radius ?? 50) / EquatorialRadiusOfEarthInKm,
          ],
        },
      };
    }

    if (options?.creator) {
      singleCreator = await this.getCreatorByUsername(options.creator);
      if (singleCreator) {
        searchFilter.creator = singleCreator.id;
      } else {
        return [];
      }
    }

    const creatorIds = new Set<string>();
    const results = await this.sites
      .find(searchFilter, searchOptions)
      .toArray();

    if (singleCreator) {
      return results.map(
        (result) =>
          new DefaultDiveSite(
            this.mongoClient,
            this.log,
            result,
            singleCreator,
          ),
      );
    }

    results.forEach((site) => {
      creatorIds.add(site.creator);
    });

    const creators = await this.getCreatorsById(creatorIds);

    return results.map(
      (result) =>
        new DefaultDiveSite(
          this.mongoClient,
          this.log,
          result,
          creators[result.creator],
        ),
    );
  }

  private async getCreatorByUsername(
    username: string,
  ): Promise<DiveSiteCreator | undefined> {
    const creator = await this.users.findOne(
      { usernameLowered: username.toLocaleLowerCase() },
      {
        projection: {
          _id: 1,
          username: 1,
          'profile.name': 1,
        },
      },
    );

    if (creator) {
      return {
        id: creator._id,
        username: creator.username,
        displayName: creator.profile?.name ?? username,
      };
    }

    return undefined;
  }

  private async getCreatorsById(
    ids: Set<string>,
  ): Promise<DiveSiteCreatorTable> {
    const results = this.users.find(
      {
        _id: {
          $in: [...ids],
        },
      },
      {
        projection: {
          _id: true,
          username: true,
          'profile.name': true,
        },
      },
    );

    const creators: DiveSiteCreatorTable = {};
    for await (const result of results) {
      creators[result._id] = {
        id: result._id,
        username: result.username,
        displayName: result.profile?.name ?? result.username,
      };
    }
    return creators;
  }
}
