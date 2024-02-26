import {
  CreateOrUpdateDiveSiteDTO,
  DiveSitesSortBy,
  SearchDiveSitesParamsDTO,
  SortOrder,
} from '@bottomtime/api';

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model, PopulateOptions } from 'mongoose';
import { v4 as uuid } from 'uuid';

import {
  DiveSiteData,
  DiveSiteModel,
  DiveSiteModelName,
  UserData,
} from '../schemas';
import { DiveSite, PopulatedDiveSiteDocument } from './dive-site';
import { DiveSiteQueryBuilder } from './dive-site-query-builder';

export type CreateDiveSiteOptions = CreateOrUpdateDiveSiteDTO & {
  creator: string;
};

export type SearchDiveSitesOptions = SearchDiveSitesParamsDTO;
export type SearchDiveSitesResults = {
  sites: DiveSite[];
  totalCount: number;
};

const CreatorPopulateOptions: PopulateOptions = {
  path: 'creator',
  select: '_id username memberSince',
} as const;

@Injectable()
export class DiveSitesService {
  private readonly log = new Logger(DiveSitesService.name);

  constructor(
    @InjectModel(DiveSiteModelName)
    private readonly DiveSites: Model<DiveSiteData>,
  ) {}

  async searchDiveSites(
    options: SearchDiveSitesOptions,
  ): Promise<SearchDiveSitesResults> {
    const query = new DiveSiteQueryBuilder()
      .withTextSearch(options.query)
      .withCreatorId(options.creator)
      .withDifficulty(options.difficulty)
      .withFreeToDive(options.freeToDive)
      .withGeoLocation(options.location, options.radius)
      .withRating(options.rating)
      .withShoreAccesss(options.shoreAccess)
      .build();

    const sortOrder = options.sortOrder === SortOrder.Ascending ? 1 : -1;
    let sort: { [key: string]: -1 | 1 };

    if (options.sortBy === DiveSitesSortBy.Name) {
      sort = { name: sortOrder };
    } else {
      sort = { averageRating: sortOrder };
    }

    const [sites, totalCount] = await Promise.all([
      this.DiveSites.find(query)
        .sort(sort)
        .populate<UserData>(CreatorPopulateOptions)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 100)
        .exec(),
      this.DiveSites.countDocuments(query).exec(),
    ]);

    return {
      sites: sites.map((site) => new DiveSite(this.DiveSites, site)),
      totalCount,
    };
  }

  async getDiveSite(siteId: string): Promise<DiveSite | undefined> {
    const site: PopulatedDiveSiteDocument | null =
      await this.DiveSites.findById(siteId)
        .populate<UserData>(CreatorPopulateOptions)
        .exec();

    this.log.debug('Retrieved raw dive site data:', site);

    return site ? new DiveSite(this.DiveSites, site) : undefined;
  }

  async createDiveSite(options: CreateDiveSiteOptions): Promise<DiveSite> {
    const data = new DiveSiteModel({
      _id: uuid(),
      creator: options.creator,
      createdOn: new Date(),

      name: options.name,
      location: options.location,
      description: options.description,
      depth: options.depth,
      directions: options.directions,
      freeToDive: options.freeToDive,
      shoreAccess: options.shoreAccess,
    });
    await data.populate(CreatorPopulateOptions);

    const site = new DiveSite(this.DiveSites, data);
    if (options.gps) {
      site.gps = options.gps;
    }
    await site.save();

    return site;
  }
}
