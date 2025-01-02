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

@Controller(`api/operators/:operatorKey/reviews/:reviewId`)
@UseGuards(AssertOperator, AssertOperatorReview)
export class OperatorReviewController {
  @Get()
  getReview(@TargetOperatorReview() review: OperatorReview): OperatorReviewDTO {
    return review.toJSON();
  }

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
