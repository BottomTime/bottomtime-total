import {
  CanActivate,
  ExecutionContext,
  Inject,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';

import { Request } from 'express';

import { User, UsersService } from '../users';

export class AssertBuddy implements CanActivate {
  constructor(@Inject(UsersService) private readonly users: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const buddyUsername = req.params.buddyUsername;

    const buddy = await this.users.getUserByUsernameOrEmail(buddyUsername);

    if (!buddy) {
      throw new NotFoundException(
        `Could not find buddy with username "${buddyUsername}".`,
      );
    }

    req.targetBuddy = buddy;
    return true;
  }
}

export const TargetBuddy = createParamDecorator(
  (_, ctx: ExecutionContext): User | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.targetBuddy;
  },
);
