import {
  CreateOrUpdateLogEntryParamsDTO,
  CreateOrUpdateLogEntryParamsSchema,
  FinalizeImportParamsDTO,
  FinalizeImportParamsSchema,
  LogsImportDTO,
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

import { AssertAccountOwner, AssertAuth, AssertTargetUser } from '../../users';
import { ZodValidator } from '../../zod-validator';
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
export class LogEntryImportController {
  private readonly log = new Logger(LogEntryImportController.name);

  /**
   * @openapi
   * /api/users/{username}/logImports/{importId}:
   *   delete:
   *     tags:
   *       - Dive Logs
   *       - Experimental
   *     summary: Cancel remove an import session
   *     description: Cancel and remove an import session for a user
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/LogEntryImportId"
   *     responses:
   *       200:
   *         description: The import session was successfully canceled. The details of the session will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/LogEntryImport"
   *       401:
   *         description: The request failed because the user could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the user does not have permission to modify the indicated logbook.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the indicated logbook or import session could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       405:
   *         description: The request failed because the import session has already been finalized and can no longer be canceled.
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
  @Delete()
  async cancelImport(@TargetImport() importEntity: LogEntryImport) {
    await importEntity.cancel();
    return importEntity.toJSON();
  }

  /**
   * @openapi
   * /api/users/{username}/logImports/{importId}:
   *   get:
   *     tags:
   *       - Dive Logs
   *       - Experimental
   *     summary: Get import session
   *     description: Retrieve the details of an import session for a user
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/LogEntryImportId"
   *     responses:
   *       200:
   *         description: The request succeeded and the response body will contain the details of the import session.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/LogEntryImport"
   *       401:
   *         description: The request failed because the user could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the user does not have permission to view the indicated logbook.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the indicated logbook or import session could not be found.
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
  async getImport(
    @TargetImport() importEntity: LogEntryImport,
  ): Promise<LogsImportDTO> {
    return importEntity.toJSON();
  }

  /**
   * @openapi
   * /api/users/{username}/logImports/{importId}:
   *   post:
   *     tags:
   *       - Dive Logs
   *       - Experimental
   *     summary: Import a batch of log entries
   *     description: Import a batch of log entries into an import session
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/LogEntryImportId"
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: array
   *             items:
   *               $ref: "#/components/schemas/CreateOrUpdateLogEntry"
   *             minItems: 1
   *             required: true
   *       required: true
   *     responses:
   *       201:
   *         description: The request succeeded and the entries were successfully added to the import session.
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
   *                   description: The number of records that were successfully added to the import session as a result of this request.
   *                   example: 50
   *                 totalRecords:
   *                   type: number
   *                   format: int32
   *                   description: The total number of records that have been added to the import session so far.
   *                   example: 111
   *       400:
   *         description: The request failed because the request body was invalid or missing.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The request failed because the user could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the user does not have permission to modify the indicated logbook.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the indicated logbook or import session could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       413:
   *         description: |
   *           The request failed because the request body was too large. For a large import operation it is best to break
   *           the list of records up into batches and call this route multiple times.
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
  async importBatch(
    @TargetImport() importEntity: LogEntryImport,
    @Body(new ZodValidator(CreateOrUpdateLogEntryParamsSchema.array().min(1)))
    records: CreateOrUpdateLogEntryParamsDTO[],
  ): Promise<RecordsAddedResponseDTO> {
    await importEntity.addRecords(records);
    const totalRecords = await importEntity.getRecordCount();

    return {
      addedRecords: records.length,
      totalRecords,
    };
  }

  /**
   * @openapi
   * /api/users/{username}/logImports/{importId}/finalize:
   *   post:
   *     tags:
   *       - Dive Logs
   *       - Experimental
   *     summary: Finalize an import session
   *     description: Finalize an import session and import all records into the target logbook
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/LogEntryImportId"
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               logNumberGenerationMode:
   *                 type: string
   *                 description: |
   *                   Indicates how log numbers will be generated for log entries that are imported.
   *                   - `none`: Log numbers will not be generated for any log entries.
   *                   - `auto`: A log number will be generated for log entries that do not have one.
   *                   - `all`: A log number will be generated for all log entries (ignoring values that may be in the import data).
   *                 enum:
   *                   - none
   *                   - auto
   *                   - all
   *                 example: all
   *               startingLogNumber:
   *                 type: number
   *                 description: |
   *                   The number from which to start numbering log entries as they are imported.
   *                   (E.g. the first entry will be `startingLogNumber`, then `startingLogNumber + 1`, etc.)
   *                   This is required if `logNumberGenerationMode` is set to `all` or `auto`.
   *                 format: int32
   *                 minimum: 1
   *                 example: 109
   *     responses:
   *       202:
   *         description: The request was accpeted and the import will be processed. The status can be checked by polling the import session's route.
   *       400:
   *         description: The request failed because the request body failed validation. Check the response body for more details.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The request failed because the user could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the user does not have permission to modify the indicated logbook.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the indicated logbook or import session could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       405:
   *         description: |
   *           The request failed because the indicated import session has already been finalized
   *           or has not yet had any records added to it.
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
  @Post('finalize')
  @HttpCode(HttpStatus.ACCEPTED)
  finalizeImport(
    @TargetImport() importEntity: LogEntryImport,
    @Body(new ZodValidator(FinalizeImportParamsSchema))
    options: FinalizeImportParamsDTO,
  ) {
    let entryCount = 0;
    importEntity.finalize(options).subscribe({
      next: () => {
        entryCount++;
      },
      error: async (error) => {
        this.log.error(error);
      },
      complete: () => {
        this.log.log(
          `Import with ID "${importEntity.id}" finalized. Imported ${entryCount} log entries successfully.`,
        );
      },
    });
  }
}
