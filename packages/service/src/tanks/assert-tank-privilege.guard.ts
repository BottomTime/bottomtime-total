import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { User } from '../users';
import { UserRole } from '@bottomtime/api';

@Injectable()
export class AssertTankPrivilege implements CanActivate {
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
      `You are not authorized to view, modify, or delete tank profiles for user "${targetUser.username}".`,
    );
  }
}
