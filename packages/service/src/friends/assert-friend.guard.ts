import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AssertFriend implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const friend = await this.usersService.getUserByUsernameOrEmail(
      req.params.friend,
    );

    if (!friend) {
      throw new NotFoundException(`Unable to find user ${req.params.friend}.`);
    }

    req.friend = friend;
    return true;
  }
}
