import {
  ApiList,
  CreateOrUpdateLogEntrySignatureDTO,
  CreateOrUpdateLogEntrySignatureSchema,
  LogEntrySignatureDTO,
} from '@bottomtime/api';

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Put,
  UseGuards,
} from '@nestjs/common';

import { AgenciesService, Agency } from '../certifications';
import { AssertAccountOwner, AssertTargetUser, User } from '../users';
import { bodyValidator } from '../zod-validator';
import { AssertBuddy, TargetBuddy } from './assert-buddy.guard';
import { AssertCanSign } from './assert-can-sign.guard';
import { AssertLogEntry, TargetLogEntry } from './assert-log-entry.guard';
import { AssertLogbookRead } from './assert-logbook-read.guard';
import { LogEntry } from './log-entry';
import { LogEntrySignaturesService } from './log-entry-signatures.service';

const BuddyNameKey = 'buddyUsername';
const BuddyNameParam = `:${BuddyNameKey}`;

@Controller('api/users/:username/logbook/:entryId/signatures')
@UseGuards(AssertTargetUser, AssertLogEntry)
export class LogEntrySignaturesController {
  constructor(
    @Inject(LogEntrySignaturesService)
    private readonly service: LogEntrySignaturesService,

    @Inject(AgenciesService)
    private readonly agencies: AgenciesService,
  ) {}

  @Get()
  @UseGuards(AssertLogbookRead)
  async listSignatures(
    @TargetLogEntry() logEntry: LogEntry,
  ): Promise<ApiList<LogEntrySignatureDTO>> {
    const { data, totalCount } = await this.service.listSignatures(logEntry);
    return {
      data: data.map((signature) => signature.toJSON()),
      totalCount,
    };
  }

  @Get(BuddyNameParam)
  @UseGuards(AssertLogbookRead, AssertBuddy)
  async getSignature(
    @TargetBuddy() buddy: User,
    @TargetLogEntry() logEntry: LogEntry,
  ): Promise<LogEntrySignatureDTO> {
    const signature = await this.service.getSignatureByBuddy(logEntry, buddy);

    if (!signature) {
      throw new NotFoundException(
        `Could not find signature for buddy "${buddy.username}".`,
      );
    }

    return signature.toJSON();
  }

  @Put(BuddyNameParam)
  @UseGuards(AssertBuddy, AssertCanSign)
  async createOrUpdateSignature(
    @TargetLogEntry() logEntry: LogEntry,
    @TargetBuddy() buddy: User,
    @Body(bodyValidator(CreateOrUpdateLogEntrySignatureSchema))
    options: CreateOrUpdateLogEntrySignatureDTO,
  ): Promise<LogEntrySignatureDTO> {
    let agency: Agency | undefined;
    if (options.agency) {
      agency = await this.agencies.getAgency(options.agency);
      if (!agency) {
        throw new BadRequestException(
          `Agency with ID "${options.agency}" does not exist.`,
        );
      }
    }

    let signature = await this.service.getSignatureByBuddy(logEntry, buddy);
    if (signature) {
      signature.agency = agency;
      signature.buddyType = options.buddyType;
      signature.certificationNumber = options.certificationNumber;
      await signature.save();
    } else {
      signature = await this.service.addSignature(logEntry, {
        buddy,
        agency,
        buddyType: options.buddyType,
        certificationNumber: options.certificationNumber,
      });
    }

    return signature.toJSON();
  }

  @Delete(BuddyNameParam)
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AssertAccountOwner, AssertBuddy)
  async deleteSignature(
    @TargetBuddy() buddy: User,
    @TargetLogEntry() logEntry: LogEntry,
  ): Promise<void> {
    const signature = await this.service.getSignatureByBuddy(logEntry, buddy);

    if (!signature) {
      throw new NotFoundException(
        `Could not find signature for buddy "${buddy.username}".`,
      );
    }

    await signature.delete();
  }
}
