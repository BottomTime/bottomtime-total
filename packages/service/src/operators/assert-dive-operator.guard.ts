import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';

import { DiveOperator } from './dive-operator';
import { DiveOperatorsService } from './dive-operators.service';

@Injectable()
export class AssertDiveOperator implements CanActivate {
  constructor(
    @Inject(DiveOperatorsService)
    private readonly service: DiveOperatorsService,
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

export const CurrentDiveOperator = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): DiveOperator => {
    const req = ctx.switchToHttp().getRequest();
    return req.diveOperator;
  },
);
