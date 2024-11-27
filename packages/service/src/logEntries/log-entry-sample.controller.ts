import {
  LogEntrySampleDTO,
  LogEntrySampleSchema,
  RecordsAddedResponseDTO,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Observable, from, toArray } from 'rxjs';

import { AssertAccountOwner, AssertAuth, AssertTargetUser } from '../users';
import { ZodValidator } from '../zod-validator';
import {
  AssertTargetLogEntry,
  TargetLogEntry,
} from './assert-target-log-entry.guard';
import { LogEntry } from './log-entry';

@Controller('api/users/:username/logbook/:entryId/samples')
@UseGuards(
  AssertAuth,
  AssertTargetUser,
  AssertAccountOwner,
  AssertTargetLogEntry,
)
export class LogEntrySampleController {
  private readonly log = new Logger(LogEntrySampleController.name);

  @Get()
  getSamples(
    @TargetLogEntry() entry: LogEntry,
  ): Observable<LogEntrySampleDTO[]> {
    this.log.debug(
      `Fetching data samples for log entry with ID "${entry.id}"...`,
    );
    return entry.getSamples().pipe(toArray());
  }

  @Post()
  async addSampleData(
    @TargetLogEntry() entry: LogEntry,
    @Body(new ZodValidator(LogEntrySampleSchema.array().min(1).max(500)))
    samples: LogEntrySampleDTO[],
  ): Promise<RecordsAddedResponseDTO> {
    this.log.debug(
      `Adding ${samples.length} data sample(s) to log entry with ID "${entry.id}"...`,
    );

    await entry.saveSamples(from(samples));

    const totalRecords = await entry.getSampleCount();

    // TODO: Update aggregates?

    return {
      addedRecords: samples.length,
      totalRecords,
    };
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearSamples(@TargetLogEntry() entry: LogEntry): Promise<void> {
    this.log.debug(
      `Clearing all data samples for log entry with ID "${entry.id}"...`,
    );
    await entry.clearSamples();
  }
}
