import {
  ApiList,
  CreateOrUpdateOperatorReviewDTO,
  CreateOrUpdateOperatorReviewSchema,
  ListOperatorReviewsParams,
  ListOperatorReviewsSchema,
  OperatorReviewDTO,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AssertAuth, CurrentUser, User, UsersService } from '../users';
import { ZodValidator } from '../zod-validator';
import { AssertOperator, TargetOperator } from './assert-operator.guard';
import { Operator } from './operator';

@Controller('api/operators/:operatorKey/reviews')
@UseGuards(AssertOperator)
export class OperatorReviewsController {
  constructor(@Inject(UsersService) private readonly users: UsersService) {}

  @Get()
  async listReviews(
    @TargetOperator() operator: Operator,
    @Query(new ZodValidator(ListOperatorReviewsSchema))
    options: ListOperatorReviewsParams,
  ): Promise<ApiList<OperatorReviewDTO>> {
    let creator: User | undefined;
    if (options.creator) {
      creator = await this.users.getUserByUsernameOrEmail(options.creator);
      if (!creator) return { data: [], totalCount: 0 };
    }

    const results = await operator.listReviews({
      ...options,
      creator,
    });
    return {
      data: results.data.map((review) => review.toJSON()),
      totalCount: results.totalCount,
    };
  }

  @Post()
  @UseGuards(AssertAuth)
  async createReview(
    @CurrentUser() creator: User,
    @TargetOperator() operator: Operator,
    @Body(new ZodValidator(CreateOrUpdateOperatorReviewSchema))
    options: CreateOrUpdateOperatorReviewDTO,
  ): Promise<OperatorReviewDTO> {
    const review = await operator.createReview({ ...options, creator });
    return review.toJSON();
  }
}
