import {
  ApiList,
  CreateLogsImportParamsDTO,
  CreateLogsImportParamsSchema,
  ListLogEntriesParamsDTO,
  ListLogEntryImportsParamsSchema,
  LogsImportDTO,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  AssertAccountOwner,
  AssertTargetUser,
  TargetUser,
  User,
} from '../../users';
import { ZodValidator } from '../../zod-validator';
import { AssertImportFeature } from './assert-import-feature.guard';
import { LogEntryImportService } from './log-entry-import.service';

@Controller('api/users/:username/logImports')
@UseGuards(AssertImportFeature, AssertTargetUser, AssertAccountOwner)
export class LogEntryImportsController {
  constructor(
    @Inject(LogEntryImportService)
    private readonly service: LogEntryImportService,
  ) {}

  @Get()
  async listImports(
    @TargetUser() owner: User,
    @Query(new ZodValidator(ListLogEntryImportsParamsSchema.optional()))
    query: ListLogEntriesParamsDTO | undefined,
  ): Promise<ApiList<LogsImportDTO>> {
    const { data, totalCount } = await this.service.listImports({
      owner,
      ...query,
    });

    return {
      data: data.map((i) => i.toJSON()),
      totalCount,
    };
  }

  @Post()
  async initImport(
    @TargetUser() owner: User,
    @Body(new ZodValidator(CreateLogsImportParamsSchema))
    params: CreateLogsImportParamsDTO,
  ): Promise<LogsImportDTO> {
    const newImport = await this.service.createImport(owner, params);
    return newImport.toJSON();
  }
}
