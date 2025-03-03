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

  /**
   * @openapi
   * /api/users/{username}/logbook/{entryId}/signatures:
   *   get:
   *     summary: List all signatures for a log entry.
   *     operationId: listLogEntrySignatures
   *     description: |
   *       Lists the buddy signatures for a log entry. The requesting user must have read access to the
   *       indicated logbook. That is, one of the following conditions must be met:
   *       * The logbook is marked as public.
   *       * The logbook is marked as friends-only and the user is a friend of the logbook owner.
   *       * The user is the owner of the logbook.
   *       * The user is an administrator.
   *     tags:
   *       - Dive Logs
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/LogEntryId"
   *     responses:
   *       "200":
   *         description: A list of signatures for the log entry.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - data
   *                 - totalCount
   *               properties:
   *                 data:
   *                   type: array
   *                   title: Signatures
   *                   description: The signatures attached to the log entry.
   *                   items:
   *                     $ref: "#/components/schemas/LogEntrySignature"
   *                 totalCount:
   *                   type: integer
   *                   format: int32
   *                   title: Total Count
   *                   description: The total number of signatures attached to the log entry.
   *                   example: 4
   *       "401":
   *         description: |
   *           The request failed because the target logbook is not marked as public and the
   *           request was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the target logbook is marked as private, or it is marked as friends-only but
   *           the currently authenticated user is not a friend.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: |
   *           The request failed because the requested logbook or logbook entry does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: |
   *           The request failed because of an unexpected internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
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

  /**
   * @openapi
   * /api/users/{username}/logbook/{entryId}/signatures/{buddyUsername}:
   *   get:
   *     summary: Get a signature for a log entry.
   *     operationId: getLogEntrySignature
   *     description: |
   *       Retrieves a signature for a log entry. The user must have read access to the logbook in
   *       order to retrieve the signature. That is, one of the following conditions must be met:
   *       * The logbook is marked as public.
   *       * The logbook is marked as friends-only and the user is a friend of the logbook owner.
   *       * The user is the owner of the logbook.
   *       * The user is an administrator.
   *     tags:
   *       - Dive Logs
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/LogEntryId"
   *       - $ref: "#/components/parameters/BuddyUsername"
   *     responses:
   *       "200":
   *         description: The request succeeded and the signature information will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/LogEntrySignature"
   *       "401":
   *         description: |
   *           The request failed because it could not be authenticated and the target logbook is not marked as public.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the user attempted to retrieve a signature for another user's log entry.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: |
   *           The request failed because the requested logbook, log entry, or signature does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: |
   *           The request failed because of an unexpected internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
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

  /**
   * @openapi
   * /api/users/{username}/logbook/{entryId}/signatures/{buddyUsername}:
   *   put:
   *     summary: Create or update a signature for a log entry.
   *     operationId: createOrUpdateLogEntrySignature
   *     description: |
   *       Adds a new signature or updates an existing signature for a log entry. The user must be authorized
   *       to sign the logbook entry. That is, the following rules apply:
   *       * Users must be authenticated to sign log entries.
   *       * Users cannot sign log entries on behalf of other users. (Administrators are exempt from this rule.)
   *       * Users cannot sign their own dive logs.
   *     tags:
   *       - Dive Logs
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/LogEntryId"
   *       - $ref: "#/components/parameters/BuddyUsername"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateLogEntrySignature"
   *     responses:
   *       "200":
   *         description: The updated signature for the log entry.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/LogEntrySignature"
   *       "400":
   *         description: |
   *           The request failed because the request body was missing or invalid, or because the agency
   *           specified in the request does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: |
   *           The request failed because it could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the user attempted to sign a log entry on behalf of another user, or
   *           a user attempted to sign their own log entry.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: |
   *           The request failed because the requested logbook or log entry does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: |
   *           The request failed because of an unexpected internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
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

  /**
   * @openapi
   * /api/users/{username}/logbook/{entryId}/signatures/{buddyUsername}:
   *   delete:
   *     summary: Delete a signature for a log entry.
   *     operationId: deleteLogEntrySignature
   *     description: Deletes a signature for a log entry.
   *     tags:
   *       - Dive Logs
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/LogEntryId"
   *       - $ref: "#/components/parameters/BuddyUsername"
   *     responses:
   *       "204":
   *         description: The signature was successfully deleted.
   *       "401":
   *         description: |
   *           The request failed because it could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the user attempted to delete a signature for another user's log entry.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: |
   *           The request failed because the requested logbook, log entry, or signature does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: |
   *           The request failed because of an unexpected internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
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
