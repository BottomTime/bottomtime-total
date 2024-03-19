import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  createParamDecorator,
} from '@nestjs/common';

import { DiveSiteReview } from './dive-site-review';
import { DiveSitesService } from './dive-sites.service';

@Injectable()
export class AssertDiveSiteReview implements CanActivate {
  constructor(
    @Inject(DiveSitesService) private readonly service: DiveSitesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    return true;
  }
}

export const TargetDiveSiteReview = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): DiveSiteReview => {
    const req = ctx.switchToHttp().getRequest();
    return req.diveSiteReview;
  },
);
