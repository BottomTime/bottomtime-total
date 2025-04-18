import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';

import { Request } from 'express';

import { OperatorReview } from './operator-review';

@Injectable()
export class AssertOperatorReview implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    if (!req.targetDiveOperator) {
      throw new NotFoundException('Dive operator not found.');
    }

    const review = await req.targetDiveOperator.getReview(req.params.reviewId);
    if (!review) {
      throw new NotFoundException(
        `Unable to find review with ID ${req.params.reviewId}.`,
      );
    }

    req.targetDiveOperatorReview = review;
    return true;
  }
}

export const TargetOperatorReview = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): OperatorReview | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.targetDiveOperatorReview;
  },
);
