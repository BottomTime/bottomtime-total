import {
  CreateOrUpdateDiveSiteDTO,
  SearchDiveSitesParamsDTO,
} from '@bottomtime/api';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { DiveSiteEntity, DiveSiteReviewEntity, UserEntity } from '../data';
import { User } from '../users';
import { DiveSite } from './dive-site';
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
    @InjectRepository(UserEntity)
    private readonly Users: Repository<UserEntity>,

    @InjectRepository(DiveSiteEntity)
    private readonly DiveSites: Repository<DiveSiteEntity>,

    @InjectRepository(DiveSiteReviewEntity)
    private readonly Reviews: Repository<DiveSiteReviewEntity>,

    @Inject(EventEmitter2)
    private readonly emitter: EventEmitter2,
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
      .withSortOrder(options.sortBy, options.sortOrder)
      .withPagination(options.skip, options.limit)
      .build();

    this.log.debug('Searching dive sites', options);
    this.log.verbose(query.getSql());

    const [sites, totalCount] = await query.getManyAndCount();

    return {
      sites: sites.map(
        (site) =>
          new DiveSite(
            this.Users,
            this.DiveSites,
            this.Reviews,
            this.emitter,
            site,
          ),
      ),
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
      return new DiveSite(
        this.Users,
        this.DiveSites,
        this.Reviews,
        this.emitter,
        result,
      );
    }

    return undefined;
  }

  async createDiveSite(options: CreateDiveSiteOptions): Promise<DiveSite> {
    const data = new DiveSiteEntity();

    data.id = uuid();
    data.creator = {
      id: options.creator.id,
      username: options.creator.username,
      memberSince: options.creator.memberSince,
      logBookSharing: options.creator.profile.logBookSharing,
      name: options.creator.profile.name,
      location: options.creator.profile.location,
      avatar: options.creator.profile.avatar,
    } as UserEntity;
    data.name = options.name;
    data.location = options.location;
    data.description = options.description ?? null;
    data.depth = options.depth?.depth ?? null;
    data.depthUnit = options.depth?.unit ?? null;
    data.directions = options.directions ?? null;
    data.freeToDive = options.freeToDive ?? null;
    data.shoreAccess = options.shoreAccess ?? null;

    if (options.gps) {
      data.gps = {
        type: 'Point',
        coordinates: [options.gps.lon, options.gps.lat],
      };
    }

    await this.DiveSites.save(data);

    return new DiveSite(
      this.Users,
      this.DiveSites,
      this.Reviews,
      this.emitter,
      data,
    );
  }
}
