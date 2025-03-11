import {
  CanActivate,
  ExecutionContext,
  Inject,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';

import { Request } from 'express';
import { z } from 'zod';

import { AgenciesService } from './agencies.service';
import { Agency } from './agency';

export class AssertTargetAgency implements CanActivate {
  constructor(
    @Inject(AgenciesService) private readonly service: AgenciesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const agencyId = req.params.agencyId;

    if (!z.string().uuid().safeParse(agencyId).success) {
      throw new NotFoundException(`Invalid agency ID "${agencyId}".`);
    }

    const agency = await this.service.getAgency(agencyId);
    if (!agency) {
      throw new NotFoundException(
        `Could not find agency with ID "${agencyId}".`,
      );
    }

    req.targetAgency = agency;
    return true;
  }
}

export const TargetAgency = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Agency | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.targetAgency;
  },
);
