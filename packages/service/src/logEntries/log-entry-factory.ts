import { Injectable } from '@nestjs/common';

import { Repository } from 'typeorm';

import { LogEntryAirEntity, LogEntryEntity } from '../data';
import { DiveSiteFactory } from '../diveSites';
import { LogEntry } from './log-entry';

@Injectable()
export class LogEntryFactory {
  constructor(
    private readonly Entries: Repository<LogEntryEntity>,
    private readonly EntriesAir: Repository<LogEntryAirEntity>,
    private readonly siteFactory: DiveSiteFactory,
  ) {}

  createLogEntry(data: LogEntryEntity): LogEntry {
    return new LogEntry(this.Entries, this.EntriesAir, this.siteFactory, data);
  }
}
