import {
  AddLogEntryImportRecordsResponseDTO,
  CreateOrUpdateLogEntryParamsDTO,
  CreateOrUpdateLogEntryParamsSchema,
  LogsImportDTO,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AssertAccountOwner, AssertAuth, AssertTargetUser } from '../../users';
import { ZodValidator } from '../../zod-validator';
import { AssertImportFeature } from './assert-import-feature.guard';
import { AssertImportOwner } from './assert-import-owner.guard';
import { AssertTargetImport, TargetImport } from './assert-target-import.guard';
import { LogEntryImport } from './log-entry-import';

@Controller('api/users/:username/logImports/:importId')
@UseGuards(
  AssertImportFeature,
  AssertAuth,
  AssertTargetUser,
  AssertAccountOwner,
  AssertTargetImport,
  AssertImportOwner,
)
export class LogEntryImportController {
  private readonly log = new Logger(LogEntryImportController.name);

  @Delete()
  async cancelImport(@TargetImport() importEntity: LogEntryImport) {
    await importEntity.cancel();
    return importEntity.toJSON();
  }

  finalizeImport() {}

  @Get()
  async getImport(
    @TargetImport() importEntity: LogEntryImport,
  ): Promise<LogsImportDTO> {
    return importEntity.toJSON();
  }

  listRecords() {}

  @Post()
  async importBatch(
    @TargetImport() importEntity: LogEntryImport,
    @Body(new ZodValidator(CreateOrUpdateLogEntryParamsSchema.array().min(1)))
    records: CreateOrUpdateLogEntryParamsDTO[],
  ): Promise<AddLogEntryImportRecordsResponseDTO> {
    await importEntity.addRecords(records);
    const totalRecords = await importEntity.getRecordCount();

    return {
      addedRecords: records.length,
      totalRecords,
    };
  }
}
