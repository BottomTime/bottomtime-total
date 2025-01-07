import {
  ApiList,
  CreateOrUpdateLogEntryParamsDTO,
  ListLogEntriesParamsDTO,
} from '@bottomtime/api';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {
  DiveSiteEntity,
  LogEntryEntity,
  OperatorEntity,
  UserEntity,
} from '../data';
import { DiveSite, DiveSitesService } from '../diveSites';
import { Operator, OperatorsService } from '../operators';
import { User } from '../users';
import { LogEntry } from './log-entry';
import { LogEntryFactory } from './log-entry-factory';
import { LogEntryQueryBuilder } from './log-entry-query-builder';

export type CreateLogEntryOptions = Omit<
  CreateOrUpdateLogEntryParamsDTO,
  'site' | 'operator'
> & {
  owner: User;
  site?: DiveSite;
  operator?: Operator;
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

    @Inject(OperatorsService)
    private readonly operatorsService: OperatorsService,
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
    this.log.debug(`Attempting to retrieve log entry with ID "${entryId}"...`);
    const data = await this.Entries.findOne({
      where: { id: entryId, ...(ownerId ? { owner: { id: ownerId } } : {}) },
      relations: ['owner', 'site', 'site.creator', 'operator', 'air'],
    });

    return data ? this.logEntryFactory.createLogEntry(data) : undefined;
  }

  async createLogEntry(options: CreateLogEntryOptions): Promise<LogEntry> {
    const entry = this.logEntryFactory.createLogEntryFromCreateDTO(
      options.owner,
      {
        ...options,
        site: undefined,
        operator: undefined,
      },
    );

    entry.site = options.site;
    entry.operator = options.operator;
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

  async getRecentOperators(ownerId: string, count = 10): Promise<Operator[]> {
    const query = this.Entries.createQueryBuilder('entries')
      .innerJoinAndMapOne(
        'entries.operator',
        OperatorEntity,
        'operators',
        'entries.operatorId = operators.id',
      )
      .innerJoinAndMapOne(
        'operators.owner',
        UserEntity,
        'operator_owners',
        'operators.ownerId = operator_owners.id',
      )
      .where({
        owner: { id: ownerId },
      })
      .select(['operators.id AS "operatorId"'])
      .orderBy('entries.createdAt', 'DESC')
      .take(200);

    this.log.debug('Querying for most recently used dive operator IDs...');
    this.log.verbose(query.getSql());

    const rawOperatorIds = await query.getRawMany<{
      operatorId: string;
    }>();

    const recentOperatorIds = new Set<string>();
    for (const { operatorId } of rawOperatorIds) {
      recentOperatorIds.add(operatorId);
      if (recentOperatorIds.size >= count) break;
    }

    const recentOperators = await this.operatorsService.getOperators(
      Array.from(recentOperatorIds),
    );
    return recentOperators;
  }
}
