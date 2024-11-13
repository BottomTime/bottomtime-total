import {
  ApiList,
  CreateLogsImportParamsDTO,
  ListLogEntryImportsParamsDTO,
} from '@bottomtime/api';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import { LogEntryEntity, LogEntryImportEntity } from '../data';
import { User } from '../users';
import { LogEntryImport } from './log-entry-import';
import { LogEntryImportQueryBuilder } from './log-entry-import-query-builder';

type ListLogEntryImportsOptions = ListLogEntryImportsParamsDTO & {
  owner: User;
};

@Injectable()
export class ImportService {
  private readonly log = new Logger(ImportService.name);

  constructor(
    @InjectRepository(LogEntryImportEntity)
    private readonly imports: Repository<LogEntryImportEntity>,

    @InjectRepository(LogEntryEntity)
    private readonly logEntries: Repository<LogEntryEntity>,
  ) {}

  async listImports(
    options: ListLogEntryImportsOptions,
  ): Promise<ApiList<LogEntryImport>> {
    const query = new LogEntryImportQueryBuilder(this.imports)
      .withOwner(options.owner)
      .withFinalized(options.showFinalized)
      .withPagination(options.skip, options.limit)
      .build();

    this.log.verbose('Querying for log entry imports', query.getSql());
    const [imports, totalCount] = await query.getManyAndCount();

    return {
      data: imports.map(
        (i) => new LogEntryImport(this.imports, this.logEntries, i),
      ),
      totalCount,
    };
  }

  async getImport(importId: string): Promise<LogEntryImport | undefined> {
    const result = await this.imports.findOne({
      where: { id: importId },
      relations: ['owner'],
    });

    if (result) {
      return new LogEntryImport(this.imports, this.logEntries, result);
    }

    return undefined;
  }

  async expireImports(expiration: Date): Promise<number> {
    const { affected } = await this.imports.delete({
      finalized: IsNull(),
      date: LessThanOrEqual(expiration),
    });
    return affected ?? 0;
  }

  async createImport(
    user: User,
    options?: CreateLogsImportParamsDTO,
  ): Promise<LogEntryImport> {
    const importData: LogEntryImportEntity = {
      id: uuid(),
      owner: user.toEntity(),
      date: new Date(),
      bookmark: options?.bookmark ?? null,
      device: options?.device ?? null,
      deviceId: options?.deviceId ?? null,
      finalized: null,
    };

    await this.imports.save(importData);
    return new LogEntryImport(this.imports, this.logEntries, importData);
  }
}
