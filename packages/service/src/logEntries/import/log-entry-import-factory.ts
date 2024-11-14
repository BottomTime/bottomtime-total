import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { LogEntryEntity, LogEntryImportEntity } from '../../data';
import { UserFactory } from '../../users';
import { LogEntryImport } from './log-entry-import';

@Injectable()
export class LogEntryImportFactory {
  constructor(
    @InjectRepository(LogEntryImportEntity)
    private readonly imports: Repository<LogEntryImportEntity>,

    @InjectRepository(LogEntryEntity)
    private readonly logEntries: Repository<LogEntryEntity>,

    @Inject(UserFactory) private readonly userFactory: UserFactory,
  ) {}

  createImport(data: LogEntryImportEntity): LogEntryImport {
    return new LogEntryImport(
      this.imports,
      this.logEntries,
      this.userFactory,
      data,
    );
  }
}
