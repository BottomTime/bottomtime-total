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
import { AssertLogEntry, TargetLogEntry } from './assert-log-entry.guard';
import { LogEntry } from './log-entry';

@Controller('api/users/:username/logbook/:entryId/samples')
@UseGuards(AssertAuth, AssertTargetUser, AssertAccountOwner, AssertLogEntry)
export class LogEntrySampleController {
  private readonly log = new Logger(LogEntrySampleController.name);

  /**
   * @openapi
   * /api/users/{username}/logbook/{entryId}/samples:
   *   get:
   *     summary: Fetch data samples for a log entry
   *     operationId: getLogEntrySamples
   *     description: Fetches all data samples recorded by a dive computer for a given log entry.
   *     tags:
   *       - Dive Logs
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/LogEntryId"
   *     responses:
   *       "200":
   *         description: The request was successful and the data samples will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/LogEntrySample"
   *       "401":
   *         description: The request was rejected because the user could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request was rejected because the user is not authorized to view the indicated dive log entry.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because either the username or the log entry ID indicated in the path could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed due to an unexpected server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get()
  getSamples(
    @TargetLogEntry() entry: LogEntry,
  ): Observable<LogEntrySampleDTO[]> {
    this.log.debug(
      `Fetching data samples for log entry with ID "${entry.id}"...`,
    );
    return entry.getSamples().pipe(toArray());
  }

  /**
   * @openapi
   * /api/users/{username}/logbook/{entryId}/samples:
   *   post:
   *     summary: Add data samples to log entry
   *     operationid: createLogEntrySamples
   *     description: |
   *       Adds new data samples to a log entry. This operation can be called multiple times if needed
   *       to avoid issues with requests with extra large payloads.
   *     tags:
   *       - Dive Logs
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/LogEntryId"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: array
   *             items:
   *               $ref: "#/components/schemas/LogEntrySample"
   *             minLength: 1
   *             maxLength: 500
   *     responses:
   *       "201":
   *         description: The request succeeded and the data samples were added to the log entry.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - addedRecords
   *                 - totalRecords
   *               properties:
   *                 addedRecords:
   *                   type: number
   *                   format: int32
   *                   title: Records Added
   *                   description: Number of new data samples added to the log entry as a result of this request
   *                   example: 442
   *                 totalRecords:
   *                   type: number
   *                   format: int32
   *                   title: Total Records
   *                   description: |
   *                     The total number of data samples attached to this log entry
   *                     (including the ones just added as a result of this request.)
   *                   example: 1024
   *       "401":
   *         description: The request was rejected because the user could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request was rejected because the user is not authorized to modify the indicated log entry.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request was rejected because either the username or log entry ID indicated in the path could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "413":
   *         description: |
   *           The request failed because the request body was too large. Try chunking your request up by
   *           sending the data samples in batches over multiple smaller requests.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed due to an unexpected server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
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

    return {
      addedRecords: samples.length,
      totalRecords,
    };
  }

  /**
   * @openapi
   * /api/users/{username}/logbook/{entryId}/samples:
   *   delete:
   *     summary: Remove all data samples from log entry
   *     operationId: deleteLogEntrySamples
   *     description: |
   *       Removes all data samples from a dive log entry. (Effectively erases the computer-computer generated data while
   *       keeping the rest of the entry.)
   *     tags:
   *       - Dive Logs
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/LogEntryId"
   *     responses:
   *       "204":
   *         description: The request succeeded. There is no further information to return.
   *       "401":
   *         description: The request was rejected because the user could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request was rejected because the user is not authorized to modify the indicated dive log entry.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because either the username or the log entry ID indicated in the path could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed due to an unexpected server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearSamples(@TargetLogEntry() entry: LogEntry): Promise<void> {
    this.log.debug(
      `Clearing all data samples for log entry with ID "${entry.id}"...`,
    );
    await entry.clearSamples();
  }
}
