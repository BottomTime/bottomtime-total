import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';

import { DiveSite } from './dive-site';
import { DiveSitesService } from './dive-sites.service';

@Injectable()
export class AssertDiveSite implements CanActivate {
  constructor(
    @Inject(DiveSitesService)
    private readonly service: DiveSitesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const diveSite = await this.service.getDiveSite(req.params.siteId);

    if (!diveSite) {
      throw new NotFoundException(
        `Dive site with ID ${req.params.siteId} not found.`,
      );
    }

    req.diveSite = diveSite;
    return true;
  }
}

export const TargetDiveSite = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): DiveSite => {
    const req = ctx.switchToHttp().getRequest();
    return req.diveSite;
  },
);
