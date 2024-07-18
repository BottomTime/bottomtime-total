import { UserRole } from '@bottomtime/api';

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Request } from 'express';

import { User } from '..';

@Injectable()
export class AssertAdmin implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user instanceof User ? req.user : undefined;

    if (!user) {
      throw new UnauthorizedException(
        'You must be logged in as an administrator to perform this action.',
      );
    }

    if (user.role !== UserRole.Admin) {
      throw new ForbiddenException(
        'You must be logged in as an administrator to perform this action.',
      );
    }

    return true;
  }
}
