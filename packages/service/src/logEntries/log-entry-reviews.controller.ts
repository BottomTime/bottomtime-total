import {
  CreateOrUpdateDiveSiteReviewDTO,
  CreateOrUpdateDiveSiteReviewSchema,
  CreateOrUpdateOperatorReviewDTO,
  CreateOrUpdateOperatorReviewSchema,
  DiveSiteReviewDTO,
  OperatorReviewDTO,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  MethodNotAllowedException,
  NotFoundException,
  Put,
  UseGuards,
} from '@nestjs/common';

import { DiveSitesService } from '../diveSites';
import { OperatorsService } from '../operators';
import {
  AssertAccountOwner,
  AssertAuth,
  AssertTargetUser,
  TargetUser,
  User,
} from '../users';
import { ZodValidator } from '../zod-validator';
import { AssertLogEntry, TargetLogEntry } from './assert-log-entry.guard';
import { LogEntry } from './log-entry';

const ReviewOperatorKey = 'reviewOperator';
const ReviewSiteKey = 'reviewSite';

@Controller('api/users/:username/logbook/:entryId')
@UseGuards(AssertAuth, AssertTargetUser, AssertAccountOwner, AssertLogEntry)
export class LogEntryReviewsController {
  private readonly log = new Logger(LogEntryReviewsController.name);

  constructor(
    @Inject(OperatorsService)
    private readonly operatorsService: OperatorsService,

    @Inject(DiveSitesService)
    private readonly diveSitesService: DiveSitesService,
  ) {}

  /**
   * @openapi
   * /api/users/{username}/logbook/{entryId}/reviewOperator:
   *   get:
   *     tags:
   *       - Dive Logs
   *     summary: Retrieve the operator review for a log entry
   *     description: |
   *       Retrieve the operator review for a log entry. If the log entry does not have an operator assigned, a 404 Not Found response will be returned.
   *     operationId: getLogEntryOperatorReview
   *     parameters:
   *       - $ref: "#/components/parameters/username"
   *       - $ref: "#/components/parameters/entryId"
   *     responses:
   *       "200":
   *         description: The operator review for the log entry
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/DiveOperatorReview"
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
   *         description: |
   *           The request was rejected because the indicated log entry does not exist, does not have an operator assigned or
   *           the the operator has not been reviewed.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get(ReviewOperatorKey)
  async getOperatorReview(
    @TargetLogEntry() logEntry: LogEntry,
  ): Promise<OperatorReviewDTO> {
    if (!logEntry.operator) {
      throw new NotFoundException(
        'Unable to retrieve operator review for this log entry. Log entry does not have a dive operator assigned.',
      );
    }

    const review = await logEntry.operator.getReviewByLogEntry(logEntry.id);
    if (!review) {
      throw new NotFoundException(
        'Unable to retrieve operator review for this log entry. Review not found.',
      );
    }

    return review.toJSON();
  }

  /**
   * @openapi
   * /api/users/{username}/logbook/{entryId}/reviewOperator:
   *   put:
   *     tags:
   *       - Dive Logs
   *     summary: Review a dive operator for a log entry
   *     description: |
   *       Review a dive operator for a log entry. If the log entry does not have a dive operator assigned, a 405 Method Not Allowed response will be returned.
   *     operationId: reviewLogEntryOperator
   *     parameters:
   *       - $ref: "#/components/parameters/username"
   *       - $ref: "#/components/parameters/entryId"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateDiveOperatorReview"
   *     responses:
   *       "200":
   *         description: The operator review for the log entry
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/DiveOperatorReview"
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
   *         description: The request was rejected because the indicated log entry does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "405":
   *         description: |
   *           The request was rejected because the indicated log entry does not have a dive operator assigned.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Put(ReviewOperatorKey)
  async reviewOperator(
    @TargetUser() creator: User,
    @TargetLogEntry() logEntry: LogEntry,
    @Body(new ZodValidator(CreateOrUpdateOperatorReviewSchema))
    options: CreateOrUpdateOperatorReviewDTO,
  ): Promise<OperatorReviewDTO> {
    if (!logEntry.operator) {
      throw new MethodNotAllowedException(
        'Unable to review operator for this log entry. Log entry does not have a dive operator assigned.',
      );
    }

    this.log.debug(
      `Attempting to retrieve operator associated with log entry "${logEntry.id}"...`,
    );
    const operator = await this.operatorsService.getOperator(
      logEntry.operator.id,
    );
    if (!operator) {
      throw new MethodNotAllowedException(
        'Unable to review operator for this log entry. Dive operator not found.',
      );
    }

    let review = await operator.getReviewByLogEntry(logEntry.id);
    if (review) {
      this.log.debug(
        `Updating existing operator review for log entry "${logEntry.id}"...`,
      );
      review.rating = options.rating;
      review.comments = options.comments;
      await review.save();
    } else {
      this.log.debug(
        `Creating new operator review for log entry "${logEntry.id}"...`,
      );
      review = await operator.createReview({
        creator,
        logEntryId: logEntry.id,
        rating: options.rating,
        comments: options.comments,
      });
    }

    return review.toJSON();
  }

  /**
   * @openapi
   * /api/users/{username}/logbook/{entryId}/reviewOperator:
   *   delete:
   *     tags:
   *       - Dive Logs
   *     summary: Delete the operator review for a log entry
   *     description: |
   *       Delete the operator review for a log entry. If the log entry does not have an operator assigned, a 404 Not Found response will be returned.
   *     operationId: deleteLogEntryOperatorReview
   *     parameters:
   *       - $ref: "#/components/parameters/username"
   *       - $ref: "#/components/parameters/entryId"
   *     responses:
   *       "204":
   *         description: The operator review was successfully deleted
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
   *         description: |
   *           The request was rejected because the indicated log entry does not exist, does not have an operator assigned or
   *           the the operator has not been reviewed.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Delete(ReviewOperatorKey)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOperatorReview(
    @TargetLogEntry() logEntry: LogEntry,
  ): Promise<void> {
    if (!logEntry.operator) {
      throw new NotFoundException(
        'Unable to delete operator review for this log entry. Log entry does not have a dive operator assigned.',
      );
    }

    const review = await logEntry.operator.getReviewByLogEntry(logEntry.id);
    if (!review) {
      throw new NotFoundException(
        'Unable to delete operator review for this log entry. Review not found.',
      );
    }

    await review.delete();
  }

  /**
   * @openapi
   * /api/users/{username}/logbook/{entryId}/reviewSite:
   *   get:
   *     tags:
   *       - Dive Logs
   *     summary: Retrieve the dive site review for a log entry
   *     description: |
   *       Retrieve the dive site review for a log entry. If the log entry does not have a dive site assigned, a 404 Not Found response will be returned.
   *     operationId: getLogEntrySiteReview
   *     parameters:
   *       - $ref: "#/components/parameters/username"
   *       - $ref: "#/components/parameters/entryId"
   *     responses:
   *       "200":
   *         description: The dive site review for the log entry
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/DiveSiteReview"
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
   *         description: |
   *           The request was rejected because the indicated log entry does not exist, does not have a dive site assigned or
   *           the the dive site has not been reviewed.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get(ReviewSiteKey)
  async getSiteReview(
    @TargetLogEntry() logEntry: LogEntry,
  ): Promise<DiveSiteReviewDTO> {
    if (!logEntry.site) {
      throw new NotFoundException(
        'Unable to retrieve dive site review for this log entry. Log entry does not have a dive site assigned.',
      );
    }

    const review = await logEntry.site.getReviewByLogEntry(logEntry.id);
    if (!review) {
      throw new NotFoundException(
        'Unable to retrieve dive site review for this log entry. Review not found.',
      );
    }

    return review.toJSON();
  }

  /**
   * @openapi
   * /api/users/{username}/logbook/{entryId}/reviewSite:
   *   put:
   *     tags:
   *       - Dive Logs
   *     summary: Review a dive site for a log entry
   *     description: |
   *       Review a dive site for a log entry. If the log entry does not have a dive site assigned, a 405 Method Not Allowed response will be returned.
   *     operationId: reviewLogEntrySite
   *     parameters:
   *       - $ref: "#/components/parameters/username"
   *       - $ref: "#/components/parameters/entryId"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateDiveSiteReview"
   *     responses:
   *       "200":
   *         description: The dive site review for the log entry
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/DiveSiteReview"
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
   *         description: The request was rejected because the indicated log entry does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "405":
   *         description: |
   *           The request was rejected because the indicated log entry does not have a dive site assigned.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Put(ReviewSiteKey)
  async reviewSite(
    @TargetUser() creator: User,
    @TargetLogEntry() logEntry: LogEntry,
    @Body(new ZodValidator(CreateOrUpdateDiveSiteReviewSchema))
    options: CreateOrUpdateDiveSiteReviewDTO,
  ): Promise<DiveSiteReviewDTO> {
    if (!logEntry.site) {
      throw new MethodNotAllowedException(
        'Unable to review dive site for this log entry. Log entry does not have a dive site assigned.',
      );
    }

    const site = await this.diveSitesService.getDiveSite(logEntry.site.id);
    if (!site) {
      throw new MethodNotAllowedException(
        'Unable to review dive site for this log entry. Dive site not found.',
      );
    }

    let review = await site.getReviewByLogEntry(logEntry.id);
    if (review) {
      this.log.debug(
        `Updating existing dive site review for log entry "${logEntry.id}"...`,
      );
      review.rating = options.rating;
      review.comments = options.comments;
      review.difficulty = options.difficulty;
      await review.save();
    } else {
      this.log.debug(
        `Creating new dive site review for log entry "${logEntry.id}"...`,
      );
      review = await site.createReview({
        creatorId: creator.id,
        logEntryId: logEntry.id,
        rating: options.rating,
        comments: options.comments,
        difficulty: options.difficulty,
      });
    }

    return review.toJSON();
  }

  /**
   * @openapi
   * /api/users/{username}/logbook/{entryId}/reviewSite:
   *   delete:
   *     tags:
   *       - Dive Logs
   *     summary: Delete the dive site review for a log entry
   *     description: |
   *       Delete the dive site review for a log entry. If the log entry does not have a dive site assigned, a 404 Not Found response will be returned.
   *     operationId: deleteLogEntrySiteReview
   *     parameters:
   *       - $ref: "#/components/parameters/username"
   *       - $ref: "#/components/parameters/entryId"
   *     responses:
   *       "204":
   *         description: The dive site review was successfully deleted
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
   *         description: |
   *           The request was rejected because the indicated log entry does not exist, does not have a dive site assigned or
   *           the the dive site has not been reviewed.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Delete(ReviewSiteKey)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSiteReview(@TargetLogEntry() logEntry: LogEntry): Promise<void> {
    if (!logEntry.site) {
      throw new NotFoundException(
        'Unable to delete dive site review for this log entry. Log entry does not have a dive site assigned.',
      );
    }

    const review = await logEntry.site.getReviewByLogEntry(logEntry.id);
    if (!review) {
      throw new NotFoundException(
        'Unable to delete dive site review for this log entry. Review not found.',
      );
    }

    await review.delete();
  }
}
