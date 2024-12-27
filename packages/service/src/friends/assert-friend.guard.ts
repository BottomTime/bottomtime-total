import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';

import { Request } from 'express';

import { User } from '../users';
import { UsersService } from '../users/users.service';

@Injectable()
export class AssertFriend implements CanActivate {
  constructor(
    @Inject(UsersService) private readonly usersService: UsersService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
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
  (_: unknown, ctx: ExecutionContext): User | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.targetFriend;
  },
);
