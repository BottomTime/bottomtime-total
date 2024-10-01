import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { Request } from 'express';

import { extractJwt } from './extract-jwt';

export const Jwt = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return extractJwt(req) ?? undefined;
  },
);
