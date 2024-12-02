import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { LogEntryImportEntity, LogEntryImportRecordEntity } from '../../data';
import { UserFactory } from '../../users';
import { Importer } from './importer';
import { LogEntryImport } from './log-entry-import';

@Injectable()
export class LogEntryImportFactory {
  constructor(
    @InjectRepository(LogEntryImportEntity)
    private readonly imports: Repository<LogEntryImportEntity>,
    @InjectRepository(LogEntryImportRecordEntity)
    private readonly importRecords: Repository<LogEntryImportRecordEntity>,
    @Inject(UserFactory) private readonly userFactory: UserFactory,
    @Inject(Importer) private readonly importer: Importer,
  ) {}

  createImport(data: LogEntryImportEntity): LogEntryImport {
    return new LogEntryImport(
      this.imports,
      this.importRecords,
      this.userFactory,
      this.importer,
      data,
    );
  }
}
