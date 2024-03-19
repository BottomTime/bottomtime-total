import {
  CreateOrUpdateDiveSiteReviewDTO,
  CreateOrUpdateDiveSiteReviewSchema,
  DiveSiteReviewDTO,
  ListDiveSiteReviewsParamsDTO,
  ListDiveSiteReviewsParamsSchema,
  ListDiveSiteReviewsResponseDTO,
  SuccessFailResponseDTO,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ZodValidator } from '../zod-validator';
import {
  AssertDiveSiteReview,
  TargetDiveSiteReview,
} from './assert-dive-site-review.guard';
import { AssertDiveSite, TargetDiveSite } from './assert-dive-site.guard';
import { DiveSite } from './dive-site';
import { DiveSiteReview } from './dive-site-review';

const DiveSiteIdParam = 'siteId';
const DiveSiteReviewIdParam = 'reviewId';

@Controller(`api/diveSites/:${DiveSiteIdParam}/reviews`)
@UseGuards(AssertDiveSite)
export class DiveSiteReviewsController {
  private readonly log = new Logger(DiveSiteReviewsController.name);

  /**
   * @openapi
   * /api/diveSites/{siteId}/reviews:
   *   get:
   *     summary: List reviews for a dive site
   *     description: Retrieve a list of reviews for a dive site
   *     operationId: listDiveSiteReviews
   *     tags:
   *       - Dive Sites
   *     parameters:
   *       - $ref: "#/components/parameters/DiveSiteId"
   *       - $ref: "#/components/parameters/DiveSiteReviewId"
   *       - in: query
   *         name: sortBy
   *         description: The field to sort the reviews by
   *         schema:
   *           type: string
   *           enum:
   *             - rating
   *             - createdOn
   *           default: rating
   *       - in: query
   *         name: sortOrder
   *         description: The order in which to sort the reviews
   *         schema:
   *           type: string
   *           enum:
   *             - asc
   *             - desc
   *           default: desc
   *       - in: query
   *         name: skip
   *         description: The number of reviews to skip over before returning results. Use for pagination.
   *         schema:
   *           type: integer
   *           format: int32
   *           min: 0
   *           default: 0
   *       - in: query
   *         name: limit
   *         description: The maximum number of reviews to return. Use for pagination.
   *         schema:
   *           type: integer
   *           format: int32
   *           min: 1
   *           max: 200
   *           default: 50
   *     responses:
   *       "200":
   *         description: A list of reviews for the dive site
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 reviews:
   *                   type: array
   *                   items:
   *                     $ref: "#/components/schemas/DiveSiteReview"
   *                 totalCount:
   *                   type: integer
   *                   format: int32
   *                   description: The total number of reviews for the dive site
   *       "404":
   *         description: The request failed because the dive site was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an unexpected server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get()
  async listReviews(
    @TargetDiveSite() site: DiveSite,
    @Query(new ZodValidator(ListDiveSiteReviewsParamsSchema))
    options: ListDiveSiteReviewsParamsDTO,
  ): Promise<ListDiveSiteReviewsResponseDTO> {
    return {
      reviews: [],
      totalCount: 0,
    };
  }

  /**
   * @openapi
   * /api/diveSites/{siteId}/reviews:
   *   post:
   *     summary: Create a review for a dive site
   *     description: Create a review for a dive site
   *     operationId: createDiveSiteReview
   *     tags:
   *       - Dive Sites
   *     parameters:
   *       - $ref: "#/components/parameters/DiveSiteId"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateDiveSiteReview"
   *     responses:
   *       "201":
   *         description: The review was created successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/DiveSiteReview"
   *       "400":
   *         description: The request failed because the request body was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the dive site was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "429":
   *         description: The request failed because the user has already posted a review of this site in the last 48 hours.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an unexpected server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post()
  async createReview(
    @TargetDiveSite() site: DiveSite,
    @Body(new ZodValidator(CreateOrUpdateDiveSiteReviewSchema))
    options: CreateOrUpdateDiveSiteReviewDTO,
  ): Promise<DiveSiteReviewDTO> {
    throw new Error('Not implemented');
  }

  /**
   * @openapi
   * /api/diveSites/{siteId}/reviews/{reviewId}:
   *   get:
   *     summary: Get a review for a dive site
   *     description: Retrieve a review for a dive site
   *     operationId: getDiveSiteReview
   *     tags:
   *       - Dive Sites
   *     parameters:
   *       - $ref: "#/components/parameters/DiveSiteId"
   *       - $ref: "#/components/parameters/DiveSiteReviewId"
   *     responses:
   *       "200":
   *         description: The review was retrieved successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/DiveSiteReview"
   *       "404":
   *         description: The request failed because the dive site or review was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an unexpected server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get(`:${DiveSiteReviewIdParam}`)
  @UseGuards(AssertDiveSiteReview)
  async getReview(
    @TargetDiveSiteReview() review: DiveSiteReview,
    @Param(DiveSiteReviewIdParam) reviewId: string,
  ): Promise<DiveSiteReviewDTO> {
    return review.toJSON();
  }

  /**
   * @openapi
   * /api/diveSites/{siteId}/reviews/{reviewId}:
   *   put:
   *     summary: Update a review for a dive site
   *     description: Update a review for a dive site
   *     operationId: updateDiveSiteReview
   *     tags:
   *       - Dive Sites
   *     parameters:
   *       - $ref: "#/components/parameters/DiveSiteId"
   *       - $ref: "#/components/parameters/DiveSiteReviewId"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateDiveSiteReview"
   *     responses:
   *       "200":
   *         description: The review was updated successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/DiveSiteReview"
   *       "400":
   *         description: The request failed because the request body was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the user is not authorized to update the review. (Only admins and the creator of the review can update it.)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the dive site or review was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an unexpected server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Put(`:${DiveSiteReviewIdParam}`)
  @UseGuards(AssertDiveSiteReview)
  async updateReview(
    @TargetDiveSiteReview() review: DiveSiteReview,
    @Body(new ZodValidator(CreateOrUpdateDiveSiteReviewSchema))
    options: CreateOrUpdateDiveSiteReviewDTO,
  ): Promise<DiveSiteReviewDTO> {
    throw new Error('Not implemented');
  }

  /**
   * @openapi
   * /api/diveSites/{siteId}/reviews/{reviewId}:
   *   delete:
   *     summary: Delete a review for a dive site
   *     description: Delete a review for a dive site
   *     operationId: deleteDiveSiteReview
   *     tags:
   *       - Dive Sites
   *     parameters:
   *       - $ref: "#/components/parameters/DiveSiteId"
   *       - $ref: "#/components/parameters/DiveSiteReviewId"
   *     responses:
   *       "200":
   *         description: The review was deleted successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Success"
   *       "401":
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the user is not authorized to delete the review. (Only admins and the creator of the review can delete it.)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the dive site or review was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an unexpected server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Delete(`:${DiveSiteReviewIdParam}`)
  @UseGuards(AssertDiveSiteReview)
  async deleteReview(
    @TargetDiveSiteReview() review: DiveSiteReview,
  ): Promise<SuccessFailResponseDTO> {
    return { succeeded: true };
  }
}
