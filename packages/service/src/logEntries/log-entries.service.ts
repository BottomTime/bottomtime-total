import {
  CreateOrUpdateLogEntryParamsDTO,
  DepthUnit,
  ListLogEntriesParamsDTO,
  TemperatureUnit,
  WeightUnit,
} from '@bottomtime/api';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

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
      logEntries: entries.map((entry) =>
        this.logEntryFactory.createLogEntry(entry),
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
      .leftJoin('entries.air', 'site_air')
      .where('entries.id = :id', { id: entryId })
      .select([
        'entries.id',
        'entries.createdAt',
        'entries.updatedAt',
        'entries.logNumber',
        'entries.timestamp',
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
    const data: LogEntryEntity = new LogEntryEntity();
    data.id = uuid();
    data.createdAt = new Date();
    data.owner = options.owner.toEntity();

    const entry = this.logEntryFactory.createLogEntry(data);
    entry.conditions.airTemperature = options.conditions?.airTemperature;
    entry.conditions.surfaceTemperature =
      options.conditions?.surfaceTemperature;
    entry.conditions.bottomTemperature = options.conditions?.bottomTemperature;
    entry.conditions.temperatureUnit =
      options.conditions?.temperatureUnit ?? TemperatureUnit.Celsius;
    entry.conditions.chop = options.conditions?.chop;
    entry.conditions.current = options.conditions?.current;
    entry.conditions.visibility = options.conditions?.visibility;
    entry.conditions.weather = options.conditions?.weather;

    entry.depths.averageDepth = options.depths?.averageDepth;
    entry.depths.maxDepth = options.depths?.maxDepth;
    entry.depths.depthUnit = options.depths?.depthUnit ?? DepthUnit.Meters;

    entry.equipment.weight = options.equipment?.weight;
    entry.equipment.weightUnit =
      options.equipment?.weightUnit ?? WeightUnit.Kilograms;
    entry.equipment.weightCorrectness = options.equipment?.weightCorrectness;
    entry.equipment.trimCorrectness = options.equipment?.trimCorrectness;
    entry.equipment.exposureSuit = options.equipment?.exposureSuit;
    entry.equipment.hood = options.equipment?.hood;
    entry.equipment.gloves = options.equipment?.gloves;
    entry.equipment.boots = options.equipment?.boots;
    entry.equipment.camera = options.equipment?.camera;
    entry.equipment.torch = options.equipment?.torch;
    entry.equipment.scooter = options.equipment?.scooter;

    entry.timing.entryTime = options.timing.entryTime;
    entry.timing.bottomTime = options.timing.bottomTime;
    entry.timing.duration = options.timing.duration;

    entry.logNumber = options.logNumber;
    entry.site = options.site;
    entry.notes = options.notes;
    // entry.tags = options.tags;

    if (options.air) entry.air = options.air;

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
