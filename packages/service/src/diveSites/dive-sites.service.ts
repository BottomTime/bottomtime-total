import {
  CreateOrUpdateDiveSiteDTO,
  SearchDiveSitesParamsDTO,
} from '@bottomtime/api';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import { DiveSiteEntity, UserEntity } from '../data';
import { User } from '../users';
import { DiveSite } from './dive-site';
import { DiveSiteFactory } from './dive-site-factory';
import { DiveSiteQueryBuilder } from './dive-site-query-builder';

export type CreateDiveSiteOptions = CreateOrUpdateDiveSiteDTO & {
  creator: User;
};

export type SearchDiveSitesOptions = SearchDiveSitesParamsDTO;
export type SearchDiveSitesResults = {
  sites: DiveSite[];
  totalCount: number;
};

@Injectable()
export class DiveSitesService {
  private readonly log = new Logger(DiveSitesService.name);

  constructor(
    @InjectRepository(DiveSiteEntity)
    private readonly DiveSites: Repository<DiveSiteEntity>,

    @Inject(DiveSiteFactory)
    private readonly siteFactory: DiveSiteFactory,
  ) {}

  async searchDiveSites(
    options: SearchDiveSitesOptions,
  ): Promise<SearchDiveSitesResults> {
    const query = new DiveSiteQueryBuilder(this.DiveSites)
      .withTextSearch(options.query)
      .withCreatorId(options.creator)
      .withDifficulty(options.difficulty)
      .withFreeToDive(options.freeToDive)
      .withGeoLocation(options.location, options.radius)
      .withRating(options.rating)
      .withShoreAccesss(options.shoreAccess)
      .withWaterType(options.waterType)
      .withSortOrder(options.sortBy, options.sortOrder)
      .withPagination(options.skip, options.limit)
      .build();

    this.log.debug('Searching dive sites', options);
    this.log.verbose(query.getSql());

    const [sites, totalCount] = await query.getManyAndCount();

    return {
      sites: sites.map((site) => this.siteFactory.createDiveSite(site)),
      totalCount,
    };
  }

  async getDiveSite(siteId: string): Promise<DiveSite | undefined> {
    const query = new DiveSiteQueryBuilder(this.DiveSites)
      .withSiteId(siteId)
      .build();

    this.log.debug(`Attempting to retrieve dive site with ID: ${siteId}`);
    this.log.verbose(query.getSql());

    const result = await query.getOne();

    if (result) {
      return this.siteFactory.createDiveSite(result);
    }

    return undefined;
  }

  async getDiveSites(siteIds: string[]): Promise<DiveSite[]> {
    if (!siteIds.length) return [];

    const query = new DiveSiteQueryBuilder(this.DiveSites)
      .withSiteIds(siteIds)
      .build();

    this.log.debug(`Attempting to retrieve ${siteIds.length} dive sites...`);
    this.log.verbose(query.getSql());

    const result = await query.getMany();
    return result
      .map((site) => this.siteFactory.createDiveSite(site))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async createDiveSite(options: CreateDiveSiteOptions): Promise<DiveSite> {
    const data = new DiveSiteEntity();
    data.id = uuid();
    data.creator = {
      id: options.creator.id,
      accountTier: options.creator.accountTier,
      username: options.creator.username,
      memberSince: options.creator.memberSince,
      logBookSharing: options.creator.profile.logBookSharing,
      name: options.creator.profile.name,
      location: options.creator.profile.location,
      avatar: options.creator.profile.avatar,
    } as UserEntity;

    const site = this.siteFactory.createDiveSite(data);
    site.name = options.name;
    site.location = options.location;
    site.description = options.description;
    site.depth = options.depth;
    site.directions = options.directions;
    site.freeToDive = options.freeToDive;
    site.shoreAccess = options.shoreAccess;
    site.waterType = options.waterType;
    site.gps = options.gps;
    await site.save();

    return site;
  }
}
