import {
  CreateOrUpdateLogEntryParamsDTO,
  CreateOrUpdateLogEntryParamsSchema,
  ListLogEntriesParamsDTO,
  ListLogEntriesParamsSchema,
  ListLogEntriesResponseDTO,
  LogEntryDTO,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AssertAuth } from '../auth';
import {
  AssertAccountOwner,
  AssertTargetUser,
  TargetUser,
  User,
} from '../users';
import { ZodValidator } from '../zod-validator';
import {
  AssertTargetLogEntry,
  TargetLogEntry,
} from './assert-target-log-entry.guard';
import { LogEntriesService } from './log-entries.service';
import { LogEntry } from './log-entry';

const LogEntryIdParam = ':entryId';

@Controller('api/users/:username/logbook')
@UseGuards(AssertAuth, AssertTargetUser, AssertAccountOwner)
export class UserLogEntriesController {
  constructor(
    @Inject(LogEntriesService) private readonly service: LogEntriesService,
  ) {}

  /**
   * @openapi
   * /api/users/{username}/logbook:
   *   get:
   *     tags:
   *       - Dive Logs
   *       - Users
   *     summary: Search log entries
   *     operationId: searchDiveLogs
   *     description: |
   *       Searches for log entries based on the provided search criteria. If no criteria are provided, all log entries are returned.
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - in: query
   *         name: query
   *         description: A search query to filter log entries by.
   *         schema:
   *           type: string
   *         required: false
   *       - in: query
   *         name: startDate
   *         description: The earliest date and time at which a dive began.
   *         schema:
   *           type: string
   *           format: date-time
   *           example: "2021-07-04T12:00"
   *         required: false
   *       - in: query
   *         name: endDate
   *         description: The latest date and time at which a dive began.
   *         schema:
   *           type: string
   *           format: date-time
   *           example: "2021-08-04T12:00"
   *         required: false
   *       - in: query
   *         name: skip
   *         description: The number of log entries to skip over before returning results. (Use for pagination.)
   *         schema:
   *           type: integer
   *           format: int32
   *           minimum: 0
   *           default: 0
   *         required: false
   *       - in: query
   *         name: limit
   *         description: The maximum number of log entries to return.
   *         schema:
   *           type: integer
   *           format: int32
   *           minimum: 1
   *           maximum: 500
   *           default: 50
   *         required: false
   *       - in: query
   *         name: sortBy
   *         description: The field by which to sort the log entries.
   *         schema:
   *           type: string
   *           enum:
   *             - entryTime
   *           default: entryTime
   *         required: false
   *       - in: query
   *         name: sortOrder
   *         description: The order in which to sort the log entries.
   *         schema:
   *           type: string
   *           enum:
   *             - asc
   *             - desc
   *           default: desc
   *         required: false
   *     responses:
   *       "200":
   *         description: The request succeeded and the the results can be found in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 logEntries:
   *                   type: array
   *                   items:
   *                     $ref: "#/components/schemas/SuccinctLogEntry"
   *                 totalCount:
   *                   type: integer
   *                   format: int32
   *                   example: 82
   *       "400":
   *         description: The request failed because the query string was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request failed because the current user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the current user is not authorized to view the target user's logs.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the target user could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get()
  async searchLogs(
    @TargetUser() user: User,
    @Query(new ZodValidator(ListLogEntriesParamsSchema))
    options?: ListLogEntriesParamsDTO,
  ): Promise<ListLogEntriesResponseDTO> {
    const { logEntries, totalCount } = await this.service.listLogEntries({
      ...options,
      ownerId: user.id,
    });

    return {
      logEntries: logEntries.map((entry) => entry.toJSON()),
      totalCount,
    };
  }

  /**
   * @openapi
   * /api/users/{username}/logbook:
   *   post:
   *     tags:
   *       - Dive Logs
   *       - Users
   *     summary: Create a log entry
   *     operationId: createLogEntry
   *     description: Creates a new log entry for the target user.
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateLogEntry"
   *     responses:
   *       "201":
   *         description: The request succeeded and the new log entry can be found in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/LogEntry"
   *       "400":
   *         description: The request failed because the request body was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request failed because the current user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the current user is not authorized to create a log entry for the target user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the target user could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post()
  async createLog(
    @TargetUser() owner: User,
    @Body(new ZodValidator(CreateOrUpdateLogEntryParamsSchema))
    options: CreateOrUpdateLogEntryParamsDTO,
  ): Promise<LogEntryDTO> {
    const logEntry = await this.service.createLogEntry({
      ...options,
      ownerId: owner.id,
    });

    return logEntry.toJSON();
  }

  /**
   * @openapi
   * /api/users/{username}/logbook/{entryId}:
   *   get:
   *     tags:
   *       - Dive Logs
   *       - Users
   *     summary: Retrieve a log entry
   *     operationId: getLogEntry
   *     description: Retrieves a log entry by its ID.
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/LogEntryId"
   *     responses:
   *       "200":
   *         description: The request succeeded and the log entry can be found in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/LogEntry"
   *       "401":
   *         description: The request failed because the current user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the current user is not authorized to view the target log entry.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the target user or target log entry could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get(LogEntryIdParam)
  @UseGuards(AssertTargetLogEntry)
  getLog(@TargetLogEntry() logEntry: LogEntry): LogEntryDTO {
    return logEntry.toJSON();
  }

  /**
   * @openapi
   * /api/users/{username}/logbook/{entryId}:
   *   put:
   *     tags:
   *       - Dive Logs
   *       - Users
   *     summary: Update a log entry
   *     operationId: updateLogEntry
   *     description: Updates an existing log entry.
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/LogEntryId"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateLogEntry"
   *     responses:
   *       "200":
   *         description: The request succeeded and the updated log entry can be found in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/LogEntry"
   *       "400":
   *         description: The request failed because the request body was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request failed because the current user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the current user is not authorized to update the target log entry.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the target user or target log entry could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Put(LogEntryIdParam)
  @UseGuards(AssertTargetLogEntry)
  async updateLog(
    @TargetLogEntry() logEntry: LogEntry,
    @Body(new ZodValidator(CreateOrUpdateLogEntryParamsSchema))
    options: CreateOrUpdateLogEntryParamsDTO,
  ): Promise<LogEntryDTO> {
    logEntry.bottomTime = options.bottomTime;
    logEntry.duration = options.duration;
    logEntry.entryTime = options.entryTime;
    logEntry.logNumber = options.logNumber;
    logEntry.maxDepth = options.maxDepth;
    logEntry.notes = options.notes;

    await logEntry.save();
    return logEntry.toJSON();
  }

  /**
   * @openapi
   * /api/users/{username}/logbook/{entryId}:
   *   delete:
   *     tags:
   *       - Dive Logs
   *       - Users
   *     summary: Delete a log entry
   *     operationId: deleteLogEntry
   *     description: Deletes an existing log entry.
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/LogEntryId"
   *     responses:
   *       "204":
   *         description: The request succeeded and the log entry was deleted.
   *       "401":
   *         description: The request failed because the current user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the current user is not authorized to delete the target log entry.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the target user or target log entry could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Delete(LogEntryIdParam)
  @HttpCode(204)
  @UseGuards(AssertTargetLogEntry)
  async deleteLog(@TargetLogEntry() logEntry: LogEntry): Promise<void> {
    await logEntry.delete();
  }
}
