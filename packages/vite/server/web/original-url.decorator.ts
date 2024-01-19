import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';

const DefaultBase = '/';

export const OriginalUrl = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.originalUrl.replace(DefaultBase, '');
  },
);
