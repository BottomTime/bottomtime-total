import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { LogEntryEntity } from '../data';
import { LogEntry } from './log-entry';

@Injectable()
export class LogEntriesService {
  constructor(
    @InjectRepository(LogEntryEntity)
    private readonly Entries: Repository<LogEntryEntity>,
  ) {}

  async createLogEntry(): Promise<LogEntry> {
    throw new Error('Not implemented');
  }
}
