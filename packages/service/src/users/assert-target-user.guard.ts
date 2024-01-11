import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user';

@Injectable()
export class AssertTargetUser implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

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
