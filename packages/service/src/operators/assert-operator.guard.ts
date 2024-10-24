import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';

import { Operator } from './operator';
import { OperatorsService } from './operators.service';

@Injectable()
export class AssertOperator implements CanActivate {
  constructor(
    @Inject(OperatorsService)
    private readonly service: OperatorsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const operatorKey = req.params.operatorKey;

    if (operatorKey && typeof operatorKey !== 'string') {
      throw new BadRequestException('Operator key is missing or invalid.');
    }

    req.diveOperator = await this.service.getOperatorBySlug(operatorKey);
    if (!req.diveOperator) {
      throw new NotFoundException(
        `Dive operator with key ${operatorKey} not found.`,
      );
    }

    return true;
  }
}

export const CurrentOperator = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Operator => {
    const req = ctx.switchToHttp().getRequest();
    return req.diveOperator;
  },
);
