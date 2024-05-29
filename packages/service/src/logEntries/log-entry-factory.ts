import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { LogEntryAirEntity, LogEntryEntity } from '../data';
import { DiveSiteFactory } from '../diveSites';
import { LogEntry } from './log-entry';

@Injectable()
export class LogEntryFactory {
  constructor(
    @InjectRepository(LogEntryEntity)
    private readonly Entries: Repository<LogEntryEntity>,

    @InjectRepository(LogEntryAirEntity)
    private readonly EntriesAir: Repository<LogEntryAirEntity>,

    @Inject(DiveSiteFactory)
    private readonly siteFactory: DiveSiteFactory,
  ) {}

  createLogEntry(data: LogEntryEntity): LogEntry {
    return new LogEntry(this.Entries, this.EntriesAir, this.siteFactory, data);
  }
}
