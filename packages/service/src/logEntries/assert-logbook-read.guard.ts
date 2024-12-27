import { LogBookSharing, UserRole } from '@bottomtime/api';

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { Request } from 'express';

import { FriendsService } from '../friends';
import { User } from '../users';

@Injectable()
export class AssertLogbookRead implements CanActivate {
  constructor(
    @Inject(FriendsService) private readonly friends: FriendsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const currentUser = req.user instanceof User ? req.user : undefined;
    const targetUser = req.targetUser;

    if (!targetUser) {
      throw new NotFoundException('Target user not found.');
    }

    // Public logbooks can be viewed by anyone (including anonymous users).
    if (targetUser.profile.logBookSharing === LogBookSharing.Public) {
      return true;
    }

    // For non-public logbooks, the user must be logged in.
    if (!(currentUser instanceof User)) {
      throw new UnauthorizedException(
        'You must be logged in to view this logbook.',
      );
    }

    // Admins can view any log entry.
    if (currentUser.role === UserRole.Admin) return true;

    // Users can always view their own logbooks.
    if (currentUser.id === targetUser.id) return true;

    // For logbooks shared with friends, the user must be friends with the logbook owner.
    if (targetUser.profile.logBookSharing === LogBookSharing.FriendsOnly) {
      const areFriends = await this.friends.areFriends(
        currentUser.id,
        targetUser.id,
      );
      if (areFriends) return true;
    }

    // All other requests are forbidden.
    throw new ForbiddenException(
      'You do not have permission to view the requested logbook or its entries. It is not shared with you.',
    );
  }
}
