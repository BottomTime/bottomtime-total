import { UserRole } from '@bottomtime/api';

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { Request } from 'express';

import { User } from '../users';

@Injectable()
export class AssertFriendshipOwner implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const currentUser = req.user instanceof User ? req.user : undefined;
    const targetUser = req.targetUser;

    if (!currentUser) {
      throw new UnauthorizedException(
        'You must be logged in to view or modify user accounts.',
      );
    }

    if (!targetUser) {
      throw new NotFoundException('Unable to find the requested user account.');
    }

    if (currentUser.role === UserRole.Admin) {
      return true;
    }

    if (currentUser.id !== targetUser.id) {
      throw new ForbiddenException(
        'You are not authorized to view or modify the requested user account.',
      );
    }

    return true;
  }
}
