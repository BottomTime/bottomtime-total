import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { Request } from 'express';

import { User } from '.';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): User | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.user instanceof User ? req.user : undefined;
  },
);
