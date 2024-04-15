import {
  CreateOrUpdateLogEntryParamsDTO,
  ListLogEntriesParamsDTO,
} from '@bottomtime/api';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { LogEntryEntity, UserEntity } from '../data';
import { LogEntry } from './log-entry';
import { LogEntryQueryBuilder } from './log-entry-query-builder';

export type CreateLogEntryOptions = CreateOrUpdateLogEntryParamsDTO & {
  ownerId: string;
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
  ) {}

  async listLogEntries(
    options?: ListLogEntriesParamsDTO,
  ): Promise<ListLogEntriesResults> {
    const query = new LogEntryQueryBuilder(this.Entries)
      .withDateRange(options?.dateRange?.start, options?.dateRange?.end)
      .withOwner(options?.owner)
      .withPagination(options?.skip, options?.limit)
      .withSortOrder(options?.sortBy, options?.sortOrder)
      .build();

    this.log.debug('Performing search for log entries...');
    this.log.verbose(query.getSql());

    const [entries, totalCount] = await query.getManyAndCount();

    return {
      logEntries: entries.map((entry) => new LogEntry(this.Entries, entry)),
      totalCount,
    };
  }

  async getLogEntry(entryId: string): Promise<LogEntry | undefined> {
    const query = this.Entries.createQueryBuilder()
      .from(LogEntryEntity, 'entries')
      .innerJoin('entries.owner', 'owners')
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
      ]);

    this.log.debug(`Attempting to retrieve log entry with ID "${entryId}"...`);
    this.log.verbose(query.getSql());

    const data = await query.getOne();
    return data ? new LogEntry(this.Entries, data) : undefined;
  }

  async createLogEntry(options: CreateLogEntryOptions): Promise<LogEntry> {
    const data: LogEntryEntity = new LogEntryEntity();
    data.id = uuid();
    data.owner = await this.Users.findOneOrFail({
      where: { id: options.ownerId },
      select: ['id', 'username', 'memberSince', 'name', 'location', 'avatar'],
    });

    const entry = new LogEntry(this.Entries, data);
    entry.entryTime = options.entryTime;
    entry.bottomTime = options.bottomTime;
    entry.duration = options.duration;
    entry.maxDepth = options.maxDepth;
    entry.notes = options.notes;
    entry.logNumber = options.logNumber;
    await entry.save();

    return entry;
  }
}
