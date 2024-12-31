import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';

import { Request } from 'express';

import { Alert } from './alert';
import { AlertsService } from './alerts.service';

@Injectable()
export class AssertTargetAlert implements CanActivate {
  constructor(@Inject(AlertsService) private readonly service: AlertsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const targetAlert = await this.service.getAlert(req.params.alertId);
    if (!targetAlert) {
      throw new NotFoundException(
        `Alert with ID "${req.params.alertId}" not found.`,
      );
    }

    req.targetAlert = targetAlert;
    return true;
  }
}

export const TargetAlert = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Alert | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.targetAlert;
  },
);
