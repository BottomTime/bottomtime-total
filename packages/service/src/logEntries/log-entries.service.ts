import { CreateOrUpdateLogEntryParamsDTO } from '@bottomtime/api';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { LogEntryEntity, UserEntity } from '../data';
import { LogEntry } from './log-entry';
import { LogEntrySelectFields } from './log-entry-query-builder';

export type CreateLogEntryOptions = CreateOrUpdateLogEntryParamsDTO & {
  ownerId: string;
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

  async listLogEntries(): Promise<LogEntry[]> {
    return [];
  }

  async getLogEntry(entryId: string): Promise<LogEntry | undefined> {
    const query = this.Entries.createQueryBuilder()
      .from(LogEntryEntity, 'entries')
      .innerJoin('entries.owner', 'owners')
      .where('entries.id = :id', { id: entryId })
      .select(LogEntrySelectFields);

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
