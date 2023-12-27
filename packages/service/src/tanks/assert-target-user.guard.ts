import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '../users/user';
import { UsersService } from '../users/users.service';
import { UserRole } from '@bottomtime/api';

@Injectable()
export class AssertTargetUser implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    if (!req.user || !(req.user instanceof User)) {
      throw new UnauthorizedException(
        'User must be logged in to perform this action.',
      );
    }

    const currentUser: User = req.user;
    const targetUser = await this.usersService.getUserByUsernameOrEmail(
      req.params.username,
    );

    if (!targetUser) {
      throw new NotFoundException(
        `Unable to find user with username "${req.params.username}".`,
      );
    }

    if (
      targetUser.id !== currentUser.id &&
      currentUser.role !== UserRole.Admin
    ) {
      throw new ForbiddenException(
        'You are not permitted to view or modify this tank profile.',
      );
    }

    req.targetUser = targetUser;
    return true;
  }
}
