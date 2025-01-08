import {
  ApiList,
  CreateOrUpdateLogEntryParamsDTO,
  CreateOrUpdateLogEntryParamsSchema,
  DiveSiteDTO,
  GetMostRecentEntitiesParamsDTO,
  GetMostRecentEntitiesParamsSchema,
  GetNextAvailableLogNumberResponseDTO,
  ListLogEntriesParamsDTO,
  ListLogEntriesParamsSchema,
  LogEntryDTO,
  OperatorDTO,
  SuccinctLogEntryDTO,
} from '@bottomtime/api';

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Logger,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { DiveSite, DiveSitesService } from '../diveSites';
import { OperatorsService } from '../operators';
import { Operator } from '../operators';
import {
  AssertAccountOwner,
  AssertAuth,
  AssertTargetUser,
  TargetUser,
  User,
} from '../users';
import { ValidateIds } from '../validate-ids.guard';
import { ZodValidator } from '../zod-validator';
import { AssertLogEntry, TargetLogEntry } from './assert-log-entry.guard';
import { AssertLogbookRead } from './assert-logbook-read.guard';
import { LogEntriesService } from './log-entries.service';
import { LogEntry } from './log-entry';

const LogEntryIdParamName = 'entryId';
const LogEntryIdParam = `:${LogEntryIdParamName}`;

@Controller('api/users/:username/logbook')
@UseGuards(AssertTargetUser)
export class UserLogEntriesController {
  private readonly log = new Logger(UserLogEntriesController.name);

  constructor(
    @Inject(LogEntriesService) private readonly service: LogEntriesService,
    @Inject(DiveSitesService) private readonly diveSites: DiveSitesService,
    @Inject(OperatorsService) private readonly operators: OperatorsService,
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
   *         description: The earliest date and time at which a dive began. (Specified in milliseconds since Unix Epoch time.)
   *         schema:
   *           type: integer
   *           format: int64
   *           example: 1628089200000
   *         required: false
   *       - in: query
   *         name: endDate
   *         description: The latest date and time at which a dive began. (Specified in milliseconds since Unix Epoch time.)
   *         schema:
   *           type: integer
   *           format: int64
   *           example: 1628089200000
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
   *             - logNumber
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
   *               required:
   *                 - data
   *                 - totalCount
   *               properties:
   *                 data:
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
  @UseGuards(AssertLogbookRead)
  // @UseInterceptors(CacheInterceptor)
  async searchLogs(
    @TargetUser() user: User,
    @Query(new ZodValidator(ListLogEntriesParamsSchema))
    options?: ListLogEntriesParamsDTO,
  ): Promise<ApiList<SuccinctLogEntryDTO>> {
    this.log.debug('Searching for log entries...', options);
    const { data, totalCount } = await this.service.listLogEntries({
      ...options,
      ownerId: user.id,
    });

    this.log.debug('Got some log entries', data.length, user.username);

    return {
      data: data.map((entry) => entry.toSuccinctJSON()),
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
  @UseGuards(AssertAuth, AssertAccountOwner)
  async createLog(
    @TargetUser() owner: User,
    @Body(new ZodValidator(CreateOrUpdateLogEntryParamsSchema))
    options: CreateOrUpdateLogEntryParamsDTO,
  ): Promise<LogEntryDTO> {
    let site: DiveSite | undefined;
    let operator: Operator | undefined;

    if (options.site) {
      site = await this.diveSites.getDiveSite(options.site);
      if (!site) {
        throw new BadRequestException(
          `Dive site with ID "${options.site}" not found.`,
        );
      }
    }

    if (options.operator) {
      operator = await this.operators.getOperator(options.operator);
      if (!operator) {
        throw new BadRequestException(
          `Operator with ID "${options.operator}" not found.`,
        );
      }
    }

    const logEntry = await this.service.createLogEntry({
      ...options,
      owner,
      site,
      operator,
    });

    return logEntry.toJSON();
  }

  /**
   * @openapi
   * /api/users/{username}/logbook/nextLogEntryNumber:
   *   get:
   *     tags:
   *       - Dive Logs
   *       - Users
   *     summary: Get the next available log number in a user's logbook
   *     operationId: getNextLogNumber
   *     description: |
   *       Retrieves the next available log number for the target user. Will return 1 if the user has no log entries
   *       (or none with a log number set).
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     responses:
   *       "200":
   *         description: The request succeeded and the next available log number can be found in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - logNumber
   *               properties:
   *                 logNumber:
   *                   type: integer
   *                   format: int32
   *                   example: 12
   *       "401":
   *         description: The request failed because the current user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the current user does not own the requested logbook and is not an admin.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the target logbook could not be found.
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
  @Get('nextLogEntryNumber')
  @UseGuards(AssertAuth, AssertAccountOwner)
  async getNextAvailableLogNumber(
    @TargetUser() user: User,
  ): Promise<GetNextAvailableLogNumberResponseDTO> {
    const logNumber = await this.service.getNextAvailableLogNumber(user.id);
    return { logNumber };
  }

  /**
   * @openapi
   * /api/users/{username}/logbook/recentDiveSites:
   *   get:
   *     tags:
   *       - Dive Logs
   *       - Users
   *     summary: Get the most recent dive sites referenced in log entries by a user
   *     operationId: getRecentDiveSites
   *     description: |
   *       Retrieves a list of the dive sites referenced in the most recent log entries for a user. The `count` parameter will
   *       set an upper limit on the number of results returned but the actual number of results may be less if the user has not
   *       logged dives with that many distinct dive sites in their last 200 log entries.
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - in: query
   *         name: count
   *         description: The maximum number of distinct dive sites to return.
   *         schema:
   *           type: integer
   *           format: int32
   *           minimum: 1
   *           maximum: 200
   *           default: 10
   *         required: false
   *     responses:
   *       "200":
   *         description: The request succeeded and the most recent dive sites can be found in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/DiveSite"
   *       "401":
   *         description: The request failed because the current user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the current user is not authorized to view the target user's dive sites.
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
  @Get('recentDiveSites')
  @UseGuards(AssertAuth, AssertAccountOwner)
  // @UseInterceptors(CacheInterceptor)
  async getRecentDiveSites(
    @TargetUser() user: User,
    @Query(new ZodValidator(GetMostRecentEntitiesParamsSchema))
    { count }: GetMostRecentEntitiesParamsDTO,
  ): Promise<DiveSiteDTO[]> {
    const sites = await this.service.getRecentDiveSites(user.id, count);
    return sites.map((site) => site.toJSON());
  }

  @Get('recentOperators')
  @UseGuards(AssertAuth, AssertAccountOwner)
  async getRecentOperators(
    @TargetUser() user: User,
    @Query(new ZodValidator(GetMostRecentEntitiesParamsSchema))
    { count }: GetMostRecentEntitiesParamsDTO,
  ): Promise<OperatorDTO[]> {
    const operators = await this.service.getRecentOperators(user.id, count);
    return operators.map((operator) => operator.toJSON());
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
  @UseGuards(
    ValidateIds(LogEntryIdParamName),
    AssertLogbookRead,
    AssertLogEntry,
  )
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
  @UseGuards(
    ValidateIds(LogEntryIdParamName),
    AssertAuth,
    AssertAccountOwner,
    AssertLogEntry,
  )
  async updateLog(
    @TargetLogEntry() logEntry: LogEntry,
    @Body(new ZodValidator(CreateOrUpdateLogEntryParamsSchema))
    options: CreateOrUpdateLogEntryParamsDTO,
  ): Promise<LogEntryDTO> {
    logEntry.air = options.air ?? [];

    logEntry.conditions.airTemperature = options.conditions?.airTemperature;
    logEntry.conditions.surfaceTemperature =
      options.conditions?.surfaceTemperature;
    logEntry.conditions.bottomTemperature =
      options.conditions?.bottomTemperature;
    logEntry.conditions.temperatureUnit =
      options.conditions?.temperatureUnit ??
      logEntry.conditions.temperatureUnit;
    logEntry.conditions.chop = options.conditions?.chop;
    logEntry.conditions.current = options.conditions?.current;
    logEntry.conditions.visibility = options.conditions?.visibility;
    logEntry.conditions.weather = options.conditions?.weather;

    logEntry.depths.averageDepth = options.depths?.averageDepth;
    if (options.depths?.depthUnit)
      logEntry.depths.depthUnit = options.depths.depthUnit;
    logEntry.depths.maxDepth = options.depths?.maxDepth;

    logEntry.equipment.weight = options.equipment?.weight;
    if (options.equipment?.weightUnit)
      logEntry.equipment.weightUnit = options.equipment.weightUnit;
    logEntry.equipment.weightCorrectness = options.equipment?.weightCorrectness;
    logEntry.equipment.trimCorrectness = options.equipment?.trimCorrectness;
    logEntry.equipment.exposureSuit = options.equipment?.exposureSuit;
    logEntry.equipment.hood = options.equipment?.hood;
    logEntry.equipment.gloves = options.equipment?.gloves;
    logEntry.equipment.boots = options.equipment?.boots;
    logEntry.equipment.camera = options.equipment?.camera;
    logEntry.equipment.torch = options.equipment?.torch;
    logEntry.equipment.scooter = options.equipment?.scooter;

    logEntry.logNumber = options.logNumber;
    logEntry.notes = options.notes;
    logEntry.tags = options.tags ?? [];

    logEntry.timing.entryTime = new Date(options.timing.entryTime);
    logEntry.timing.timezone = options.timing.timezone;
    logEntry.timing.bottomTime = options.timing.bottomTime;
    logEntry.timing.duration = options.timing.duration;

    if (options.site) {
      const site = await this.diveSites.getDiveSite(options.site);
      if (!site) {
        throw new BadRequestException(
          `Dive site with ID "${options.site}" not found.`,
        );
      }
      logEntry.site = site;
    } else {
      logEntry.site = undefined;
    }

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
  @UseGuards(
    ValidateIds(LogEntryIdParamName),
    AssertAuth,
    AssertAccountOwner,
    AssertLogEntry,
  )
  async deleteLog(@TargetLogEntry() logEntry: LogEntry): Promise<void> {
    await logEntry.delete();
  }
}
