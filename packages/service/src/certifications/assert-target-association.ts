import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';

import { Request } from 'express';

import { ProfessionalAssociation } from './professional-association';
import { ProfessionalAssociationsService } from './professional-associations.service';

@Injectable()
export class AssertTargetAssociation implements CanActivate {
  constructor(
    @Inject(ProfessionalAssociationsService)
    private readonly service: ProfessionalAssociationsService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const associationId = req.params.associationId;
    const notFoundMessage = `Professional association with ID "${associationId}" not found.`;

    if (!req.targetUser) {
      throw new NotFoundException(notFoundMessage);
    }

    req.targetProfessionalAssociation = await this.service.getAssociation(
      req.targetUser,
      associationId,
    );

    if (!req.targetProfessionalAssociation) {
      throw new NotFoundException(notFoundMessage);
    }

    return true;
  }
}

export const TargetAssociation = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): ProfessionalAssociation | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.targetProfessionalAssociation;
  },
);
