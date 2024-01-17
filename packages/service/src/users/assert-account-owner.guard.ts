import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { User } from './user';
import { UserRole } from '@bottomtime/api';

export class AssertAccountOwner implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const currentUser: User = req.user;
    const targetUser: User = req.targetUser;

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
