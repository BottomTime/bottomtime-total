import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { User } from './user';

function isUser(data: unknown): data is User {
  return (
    !!data &&
    typeof data === 'object' &&
    'email' in data &&
    typeof data.email === 'string'
  );
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): User | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return isUser(req.user) ? req.user : undefined;
  },
);
