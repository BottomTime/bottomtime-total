import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { User } from './user';

export const CurrentAccount = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): User | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.account instanceof User ? req.account : undefined;
  },
);
