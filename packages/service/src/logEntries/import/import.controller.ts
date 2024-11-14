import { LogsImportDTO } from '@bottomtime/api';

import { Controller, Delete, Get, Logger, UseGuards } from '@nestjs/common';

import { AssertAccountOwner, AssertAuth, AssertTargetUser } from '../../users';
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
export class ImportController {
  private readonly log = new Logger(ImportController.name);

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

  importBatch() {}
}
