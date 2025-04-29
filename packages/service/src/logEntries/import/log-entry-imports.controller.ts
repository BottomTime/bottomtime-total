import {
  ApiList,
  CreateLogsImportParamsDTO,
  CreateLogsImportParamsSchema,
  ListLogEntriesParamsDTO,
  ListLogEntryImportsParamsSchema,
  LogsImportDTO,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';

import {
  AssertAccountOwner,
  AssertTargetUser,
  TargetUser,
  User,
} from '../../users';
import { ZodValidator } from '../../zod-validator';
import { AssertImportFeature } from './assert-import-feature.guard';
import { ImportFileParser } from './import-file-parser';
import { LogEntryImportService } from './log-entry-import.service';

@Controller('api/users/:username/logImports')
@UseGuards(AssertImportFeature, AssertTargetUser, AssertAccountOwner)
export class LogEntryImportsController {
  constructor(
    @Inject(LogEntryImportService)
    private readonly service: LogEntryImportService,

    @Inject(ImportFileParser)
    private readonly fileParser: ImportFileParser,
  ) {}

  /**
   * @openapi
   * /api/users/{username}/logImports:
   *   get:
   *     tags:
   *       - Dive Logs
   *       - Experimental
   *     summary: List import sessions
   *     description: List log entry import sessions for a user
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - in: query
   *         name: showFinalized
   *         description: Whether to include finalized imports in the results.
   *         schema:
   *           type: boolean
   *           example: true
   *           default: false
   *         required: false
   *       - in: query
   *         name: skip
   *         description: The number of log entry import sessions to skip over before returning results. (Used for pagination.)
   *         schema:
   *           type: integer
   *           example: 0
   *           minimum: 0
   *           default: 0
   *         required: false
   *       - in: query
   *         name: limit
   *         description: The maximum number of log entry import sessions to return. (Used for pagination.)
   *         schema:
   *           type: integer
   *           example: 10
   *           default: 10
   *           minimum: 1
   *           maximum: 500
   *         required: false
   *     responses:
   *       "200":
   *         description: The request succeeded and the response body will the list of log entry import sessions matching the query.
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
   *                     $ref: "#/components/schemas/LogEntryImport"
   *                 totalCount:
   *                   type: integer
   *                   format: int32
   *                   example: 18
   *       "400":
   *         description: The request failed because the query string was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request failed because the user could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the user does not have permission to view the target user's logbook.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the requested logbook could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed because an unexpected error occurred while processing the request.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get()
  async listImports(
    @TargetUser() owner: User,
    @Query(new ZodValidator(ListLogEntryImportsParamsSchema.optional()))
    query: ListLogEntriesParamsDTO | undefined,
  ): Promise<ApiList<LogsImportDTO>> {
    const { data, totalCount } = await this.service.listImports({
      owner,
      ...query,
    });

    return {
      data: data.map((i) => i.toJSON()),
      totalCount,
    };
  }

  /**
   * @openapi
   * /api/users/{username}/logImports:
   *   post:
   *     tags:
   *       - Dive Logs
   *       - Experimental
   *     summary: Create a new import session
   *     description: Create a new log entry import session for a user
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               device:
   *                 type: string
   *                 description: The name of the device that generated the log entries.
   *                 maxLength: 200
   *               deviceId:
   *                 type: string
   *                 description: The serial number or unique identifier for the device that generated the log entries.
   *                 maxLength: 200
   *               bookmark:
   *                 type: string
   *                 description: |
   *                   A bookmark string that can be used to determine where to begin importing logs from in the next session.
   *                   This is useful for not generating duplicate imports when occasionally importing from the same device.
   *                 maxLength: 200
   *     responses:
   *       "201":
   *         description: The request succeeded and the response body will contain the new log entry import session.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/LogEntryImport"
   *       "400":
   *         description: The request failed because the request body was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request failed because the user could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the user does not have permission to modify the target user's logbook.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the requested logbook could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed because an unexpected error occurred while processing the request.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post()
  async initImport(
    @TargetUser() owner: User,
    @Body(new ZodValidator(CreateLogsImportParamsSchema))
    params: CreateLogsImportParamsDTO,
  ): Promise<LogsImportDTO> {
    const newImport = await this.service.createImport(owner, params);
    return newImport.toJSON();
  }

  @Post('upload')
  async uploadImport(
    @TargetUser() owner: User,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<LogsImportDTO> {
    const result = await new ImportFileParser().parseFile(file, owner);
    if (result.success) return result.import.toJSON();
    else throw result.error;
  }
}
