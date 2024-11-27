import { LogEntrySampleDTO } from '@bottomtime/api';

import {
  Controller,
  Delete,
  Get,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Observable, toArray } from 'rxjs';

import { AssertAccountOwner, AssertAuth, AssertTargetUser } from '../users';
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
  addSampleData() {}

  @Delete()
  clearSamples() {}
}
