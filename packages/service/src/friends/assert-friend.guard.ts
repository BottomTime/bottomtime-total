import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  createParamDecorator,
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

    req.targetFriend = friend;
    return true;
  }
}

export const TargetFriend = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.targetFriend;
  },
);
