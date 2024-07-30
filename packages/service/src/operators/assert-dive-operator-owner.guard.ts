import { User, UserRole } from '@bottomtime/api';

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import { DiveOperator } from './dive-operator';

@Injectable()
export class AssertDiveOperatorOwner implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user: User | undefined = req.user;
    const operator: DiveOperator | undefined = req.diveOperator;

    if (!operator) {
      throw new InternalServerErrorException('Dive operator not loaded.');
    }

    if (!user) {
      throw new UnauthorizedException(
        'You must be logged in to perform this action.',
      );
    }

    if (user.role !== UserRole.Admin && operator.owner.userId !== user.id) {
      throw new ForbiddenException(
        'You are not authorized to perform this action.',
      );
    }

    return true;
  }
}
