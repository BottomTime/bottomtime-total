import {
  CreateOrUpdateDiveSiteReviewDTO,
  CreateOrUpdateDiveSiteReviewSchema,
  CreateOrUpdateOperatorReviewDTO,
  CreateOrUpdateOperatorReviewSchema,
  DiveSiteReviewDTO,
  OperatorReviewDTO,
} from '@bottomtime/api';

import { Body, Controller, Put, UseGuards } from '@nestjs/common';

import { AssertAccountOwner, AssertAuth, AssertTargetUser } from '../users';
import { ZodValidator } from '../zod-validator';
import { AssertLogEntry, TargetLogEntry } from './assert-log-entry.guard';
import { LogEntry } from './log-entry';

@Controller('api/users/:username/logbook/:entryId')
@UseGuards(AssertAuth, AssertTargetUser, AssertAccountOwner, AssertLogEntry)
export class LogEntryReviewsController {
  @Put('reviewOperator')
  async reviewOperator(
    @TargetLogEntry() logEntry: LogEntry,
    @Body(new ZodValidator(CreateOrUpdateOperatorReviewSchema))
    options: CreateOrUpdateOperatorReviewDTO,
  ): Promise<OperatorReviewDTO> {
    throw new Error('Not implemented');
  }

  @Put('reviewSite')
  async reviewSite(
    @TargetLogEntry() logEntry: LogEntry,
    @Body(new ZodValidator(CreateOrUpdateDiveSiteReviewSchema))
    options: CreateOrUpdateDiveSiteReviewDTO,
  ): Promise<DiveSiteReviewDTO> {
    throw new Error('Not implemented');
  }
}
