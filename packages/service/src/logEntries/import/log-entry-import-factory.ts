import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import { LogEntryImportEntity } from '../../data';
import { UserFactory } from '../../users';
import { LogEntryFactory } from '../log-entry-factory';
import { LogEntryImport } from './log-entry-import';

@Injectable()
export class LogEntryImportFactory {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(UserFactory) private readonly userFactory: UserFactory,
    @Inject(LogEntryFactory) private readonly entryFactory: LogEntryFactory,
  ) {}

  createImport(data: LogEntryImportEntity): LogEntryImport {
    return new LogEntryImport(
      this.dataSource,
      this.userFactory,
      this.entryFactory,
      data,
    );
  }
}
