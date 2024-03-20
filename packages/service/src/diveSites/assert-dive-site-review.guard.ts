import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';

import { DiveSite } from './dive-site';
import { DiveSiteReview } from './dive-site-review';

@Injectable()
export class AssertDiveSiteReview implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const diveSite: DiveSite | undefined = req.diveSite;

    if (!diveSite) {
      throw new NotFoundException('Dive site not found');
    }

    req.diveSiteReview = await diveSite.getReview(req.params.reviewId);

    if (!req.diveSiteReview) {
      throw new NotFoundException(
        `Unable to find review with ID ${req.params.reviewId} for dive site ${diveSite.id}`,
      );
    }

    return true;
  }
}

export const TargetDiveSiteReview = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): DiveSiteReview => {
    const req = ctx.switchToHttp().getRequest();
    return req.diveSiteReview;
  },
);
