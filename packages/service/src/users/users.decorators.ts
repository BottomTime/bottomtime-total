import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { User } from './user';

export const TargetUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.targetUser;
  },
);
