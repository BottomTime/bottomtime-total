import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';

import { Request } from 'express';

import { DiveSite } from './dive-site';
import { DiveSiteReview } from './dive-site-review';

@Injectable()
export class AssertDiveSiteReview implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const diveSite: DiveSite | undefined = req.targetDiveSite;

    if (!diveSite) {
      throw new NotFoundException('Dive site not found');
    }

    req.targetDiveSiteReview = await diveSite.getReview(req.params.reviewId);

    if (!req.targetDiveSiteReview) {
      throw new NotFoundException(
        `Unable to find review with ID ${req.params.reviewId} for dive site ${diveSite.id}`,
      );
    }

    return true;
  }
}

export const TargetDiveSiteReview = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): DiveSiteReview | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.targetDiveSiteReview;
  },
);
