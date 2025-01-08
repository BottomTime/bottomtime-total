import {
  CreateOrUpdateOperatorReviewDTO,
  CreateOrUpdateOperatorReviewSchema,
  OperatorReviewDTO,
  SuccessFailResponseDTO,
} from '@bottomtime/api';

import { Body, Controller, Delete, Get, Put, UseGuards } from '@nestjs/common';

import { ZodValidator } from '../zod-validator';
import { AssertOperatorReviewOwner } from './assert-operator-review-owner.guard';
import {
  AssertOperatorReview,
  TargetOperatorReview,
} from './assert-operator-review.guard';
import { AssertOperator } from './assert-operator.guard';
import { OperatorReview } from './operator-review';

@Controller('api/operators/:operatorKey/reviews/:reviewId')
@UseGuards(AssertOperator, AssertOperatorReview)
export class OperatorReviewController {
  /**
   * @openapi
   * /api/operators/{operatorKey}/reviews/{reviewId}:
   *   get:
   *     tags:
   *       - Dive Operators
   *     summary: Get an operator review
   *     operationId: getOperatorReview
   *     parameters:
   *       - $ref: "#/components/parameters/operatorKey"
   *       - $ref: "#/components/parameters/reviewId"
   *     responses:
   *       "200":
   *         description: The request succeeded and the operator review will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/DiveOperatorReview"
   *       "404":
   *         description: The request was rejected because the operator key or review ID was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/ErrorResponse"
   */
  @Get()
  getReview(@TargetOperatorReview() review: OperatorReview): OperatorReviewDTO {
    return review.toJSON();
  }

  /**
   * @openapi
   * /api/operators/{operatorKey}/reviews/{reviewId}:
   *   put:
   *     tags:
   *       - Dive Operators
   *     summary: Update an operator review
   *     operationId: updateOperatorReview
   *     parameters:
   *       - $ref: "#/components/parameters/operatorKey"
   *       - $ref: "#/components/parameters/reviewId"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateDiveOperatorReview"
   *     responses:
   *       "200":
   *         description: The request succeeded and the updated operator review will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/DiveOperatorReview"
   *       "400":
   *         description: The request was rejected because the request body was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request was rejected because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request was rejected because the user is not the creator of the review.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request was rejected because the operator key or review ID was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Put()
  @UseGuards(AssertOperatorReviewOwner)
  async updateReview(
    @TargetOperatorReview() review: OperatorReview,
    @Body(new ZodValidator(CreateOrUpdateOperatorReviewSchema))
    options: CreateOrUpdateOperatorReviewDTO,
  ): Promise<OperatorReviewDTO> {
    review.comments = options.comments;
    review.rating = options.rating;

    await review.save();

    return review.toJSON();
  }

  /**
   * @openapi
   * /api/operators/{operatorKey}/reviews/{reviewId}:
   *   delete:
   *     tags:
   *       - Dive Operators
   *     summary: Delete an operator review
   *     operationId: deleteOperatorReview
   *     parameters:
   *       - $ref: "#/components/parameters/operatorKey"
   *       - $ref: "#/components/parameters/reviewId"
   *     responses:
   *       "200":
   *         description: The request succeeded and the review was deleted.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/SuccessFailResponse"
   *       "401":
   *         description: The request was rejected because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request was rejected because the user is not the creator of the review.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request was rejected because the operator key or review ID was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Delete()
  @UseGuards(AssertOperatorReviewOwner)
  async deleteReview(
    @TargetOperatorReview() review: OperatorReview,
  ): Promise<SuccessFailResponseDTO> {
    const succeeded = await review.delete();
    return succeeded
      ? { succeeded }
      : { succeeded, reason: 'Review not found.' };
  }
}
