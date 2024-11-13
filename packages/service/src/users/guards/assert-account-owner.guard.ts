import { UserRole } from '@bottomtime/api';

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { User } from '../user';

export class AssertAccountOwner implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const currentUser: User = req.user;
    const targetUser: User = req.targetUser;

    if (!currentUser) {
      throw new UnauthorizedException(
        'You must be logged in to access this resource.',
      );
    }

    if (!targetUser) {
      throw new NotFoundException('The indicated user account does not exist.');
    }

    if (
      currentUser.role === UserRole.Admin ||
      currentUser.id === targetUser.id
    ) {
      return true;
    }

    throw new ForbiddenException(
      'You are not authorized to make any modifications to the indicated user account.',
    );
  }
}
