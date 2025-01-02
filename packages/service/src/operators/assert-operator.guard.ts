import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';

import { Request } from 'express';

import { Operator } from './operator';
import { OperatorsService } from './operators.service';

@Injectable()
export class AssertOperator implements CanActivate {
  constructor(
    @Inject(OperatorsService)
    private readonly service: OperatorsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const operatorKey = req.params.operatorKey;

    if (operatorKey && typeof operatorKey !== 'string') {
      throw new BadRequestException('Operator key is missing or invalid.');
    }

    req.targetDiveOperator = await this.service.getOperatorBySlug(operatorKey);
    if (!req.targetDiveOperator) {
      throw new NotFoundException(
        `Dive operator with key ${operatorKey} not found.`,
      );
    }

    return true;
  }
}

export const TargetOperator = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Operator | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.targetDiveOperator;
  },
);
