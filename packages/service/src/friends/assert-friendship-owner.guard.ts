import { UserRole } from '@bottomtime/api';

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { Observable } from 'rxjs';

import { User } from '../auth/user';

@Injectable()
export class AssertFriendshipOwner implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    const currentUser: User = req.user;
    const targetUser: User = req.targetUser;

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
