import {
  ApiList,
  CreateOrUpdateLogEntryParamsDTO,
  ListLogEntriesParamsDTO,
} from '@bottomtime/api';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { DiveSiteEntity, LogEntryEntity, UserEntity } from '../data';
import { DiveSite, DiveSitesService } from '../diveSites';
import { DiveSiteSelectFields } from '../diveSites/dive-site-query-builder';
import { User } from '../users';
import { LogEntry } from './log-entry';
import { LogEntryFactory } from './log-entry-factory';
import {
  LogEntryAirSelectFields,
  LogEntryQueryBuilder,
} from './log-entry-query-builder';

export type CreateLogEntryOptions = Omit<
  CreateOrUpdateLogEntryParamsDTO,
  'site'
> & {
  owner: User;
  site?: DiveSite;
};

export type ListLogEntriesOptions = ListLogEntriesParamsDTO & {
  ownerId?: string;
};

export type ListLogEntriesResults = {
  logEntries: LogEntry[];
  totalCount: number;
};

@Injectable()
export class LogEntriesService {
  private readonly log = new Logger(LogEntriesService.name);

  constructor(
    @InjectRepository(LogEntryEntity)
    private readonly Entries: Repository<LogEntryEntity>,

    @Inject(LogEntryFactory)
    private readonly logEntryFactory: LogEntryFactory,

    @Inject(DiveSitesService)
    private readonly diveSitesService: DiveSitesService,
  ) {}

  async listLogEntries(
    options?: ListLogEntriesOptions,
  ): Promise<ApiList<LogEntry>> {
    const query = new LogEntryQueryBuilder(this.Entries)
      .withDateRange(options?.startDate, options?.endDate)
      .withOwner(options?.ownerId)
      .withPagination(options?.skip, options?.limit)
      .withSortOrder(options?.sortBy, options?.sortOrder)
      .build();

    this.log.debug('Performing search for log entries...');
    this.log.verbose(query.getSql());

    const [entries, totalCount] = await query.getManyAndCount();

    return {
      data: entries.map((entry) => this.logEntryFactory.createLogEntry(entry)),
      totalCount,
    };
  }

  async getLogEntry(
    entryId: string,
    ownerId?: string,
  ): Promise<LogEntry | undefined> {
    const query = this.Entries.createQueryBuilder()
      .from(LogEntryEntity, 'entries')
      .innerJoin('entries.owner', 'owners')
      .leftJoin('entries.site', 'sites')
      .leftJoin('sites.creator', 'site_creators')
      .leftJoin('entries.air', 'site_air')
      .where('entries.id = :id', { id: entryId })
      .select([
        'entries.id',
        'entries.createdAt',
        'entries.updatedAt',
        'entries.logNumber',
        'entries.entryTime',
        'entries.timezone',
        'entries.bottomTime',
        'entries.duration',
        'entries.averageDepth',
        'entries.maxDepth',
        'entries.depthUnit',
        'entries.weight',
        'entries.weightUnit',
        'entries.weightCorrectness',
        'entries.trimCorrectness',
        'entries.exposureSuit',
        'entries.hood',
        'entries.gloves',
        'entries.boots',
        'entries.camera',
        'entries.torch',
        'entries.scooter',
        'entries.airTemperature',
        'entries.surfaceTemperature',
        'entries.bottomTemperature',
        'entries.temperatureUnit',
        'entries.chop',
        'entries.current',
        'entries.visibility',
        'entries.notes',
        'owners.id',
        'owners.accountTier',
        'owners.logBookSharing',
        'owners.username',
        'owners.memberSince',
        'owners.name',
        'owners.location',
        'owners.avatar',
        ...DiveSiteSelectFields,
        ...LogEntryAirSelectFields,
      ]);

    if (ownerId) {
      query.andWhere('owners.id = :ownerId', { ownerId });
    }

    this.log.debug(`Attempting to retrieve log entry with ID "${entryId}"...`);
    this.log.verbose(query.getSql());

    const data = await query.getOne();
    return data ? this.logEntryFactory.createLogEntry(data) : undefined;
  }

  async createLogEntry(options: CreateLogEntryOptions): Promise<LogEntry> {
    const entry = this.logEntryFactory.createLogEntryFromCreateDTO(
      options.owner,
      {
        ...options,
        site: undefined,
      },
    );

    entry.site = options.site;
    await entry.save();

    return entry;
  }

  async getNextAvailableLogNumber(ownerId: string): Promise<number> {
    // Need to use "any" here because TypeORM won't support keys for fields that are nullable. 😡
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const max = await this.Entries.maximum('logNumber' as any, {
      owner: { id: ownerId },
    });

    if (max) return max + 1;
    else return 1;
  }

  async getRecentDiveSites(ownerId: string, count = 10): Promise<DiveSite[]> {
    const query = this.Entries.createQueryBuilder('entries')
      .innerJoinAndMapOne(
        'entries.site',
        DiveSiteEntity,
        'sites',
        'entries.siteId = sites.id',
      )
      .innerJoinAndMapOne(
        'sites.creator',
        UserEntity,
        'site_creators',
        'sites.creatorId = site_creators.id',
      )
      .where({
        owner: { id: ownerId },
      })
      .select(['sites.id AS "siteId"'])
      .orderBy('entries.createdAt', 'DESC')
      .limit(200);

    this.log.debug('Querying for most recently used dive site IDs...');
    this.log.verbose(query.getSql());

    const rawSiteIds = await query.getRawMany<{
      siteId: string;
    }>();

    const recentSiteIds = new Set<string>();
    for (const { siteId } of rawSiteIds) {
      recentSiteIds.add(siteId);
      if (recentSiteIds.size >= count) break;
    }

    const recentSites = await this.diveSitesService.getDiveSites(
      Array.from(recentSiteIds),
    );
    return recentSites;
  }
}
