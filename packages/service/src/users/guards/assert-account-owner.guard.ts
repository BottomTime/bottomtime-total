import { UserRole } from '@bottomtime/api';

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { Request } from 'express';

import { User } from '../user';

export class AssertAccountOwner implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const currentUser = req.user instanceof User ? req.user : undefined;
    const targetUser = req.targetUser;

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
