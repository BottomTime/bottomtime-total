import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { User } from '../users/user';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): User | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.user instanceof User ? (req.user as unknown as User) : undefined;
  },
);
