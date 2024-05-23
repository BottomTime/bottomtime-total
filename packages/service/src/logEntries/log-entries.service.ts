import {
  CreateOrUpdateLogEntryParamsDTO,
  ListLogEntriesParamsDTO,
} from '@bottomtime/api';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { DiveSiteEntity, LogEntryEntity, UserEntity } from '../data';
import { DiveSite, DiveSiteFactory, DiveSitesService } from '../diveSites';
import { DiveSiteSelectFields } from '../diveSites/dive-site-query-builder';
import { LogEntry } from './log-entry';
import { LogEntryQueryBuilder } from './log-entry-query-builder';

export type CreateLogEntryOptions = Omit<
  CreateOrUpdateLogEntryParamsDTO,
  'site'
> & {
  ownerId: string;
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
    @InjectRepository(UserEntity)
    private readonly Users: Repository<UserEntity>,

    @InjectRepository(LogEntryEntity)
    private readonly Entries: Repository<LogEntryEntity>,

    @Inject(DiveSitesService)
    private readonly diveSitesService: DiveSitesService,

    @Inject(DiveSiteFactory)
    private readonly diveSiteFactory: DiveSiteFactory,
  ) {}

  async listLogEntries(
    options?: ListLogEntriesOptions,
  ): Promise<ListLogEntriesResults> {
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
      logEntries: entries.map(
        (entry) => new LogEntry(this.Entries, this.diveSiteFactory, entry),
      ),
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
      .where('entries.id = :id', { id: entryId })
      .select([
        'entries.id',
        'entries.logNumber',
        'entries.timestamp',
        'entries.entryTime',
        'entries.timezone',
        'entries.bottomTime',
        'entries.duration',
        'entries.maxDepth',
        'entries.maxDepthUnit',
        'entries.notes',
        'owners.id',
        'owners.username',
        'owners.memberSince',
        'owners.name',
        'owners.location',
        'owners.avatar',
        ...DiveSiteSelectFields,
      ]);

    if (ownerId) {
      query.andWhere('owners.id = :ownerId', { ownerId });
    }

    this.log.debug(`Attempting to retrieve log entry with ID "${entryId}"...`);
    this.log.verbose(query.getSql());

    const data = await query.getOne();
    return data
      ? new LogEntry(this.Entries, this.diveSiteFactory, data)
      : undefined;
  }

  async createLogEntry(options: CreateLogEntryOptions): Promise<LogEntry> {
    const data: LogEntryEntity = new LogEntryEntity();
    data.id = uuid();
    data.owner = await this.Users.findOneOrFail({
      where: { id: options.ownerId },
      select: ['id', 'username', 'memberSince', 'name', 'location', 'avatar'],
    });

    const entry = new LogEntry(this.Entries, this.diveSiteFactory, data);
    entry.entryTime = options.entryTime;
    entry.bottomTime = options.bottomTime;
    entry.duration = options.duration;
    entry.maxDepth = options.maxDepth;
    entry.notes = options.notes;
    entry.logNumber = options.logNumber;
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
