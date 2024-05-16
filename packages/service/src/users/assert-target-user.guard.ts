import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';

import { User } from '../auth/user';
import { UsersService } from './users.service';

@Injectable()
export class AssertTargetUser implements CanActivate {
  constructor(
    @Inject(UsersService) private readonly usersService: UsersService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const targetUser = await this.usersService.getUserByUsernameOrEmail(
      req.params.username,
    );

    if (!targetUser) {
      throw new NotFoundException(`User ${req.params.username} not found.`);
    }

    req.targetUser = targetUser;
    return true;
  }
}

export const TargetUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.targetUser;
  },
);
