import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { Request } from 'express';
import { Details } from 'express-useragent';

export const UserAgent = createParamDecorator(
  (
    param: keyof Details | undefined,
    ctx: ExecutionContext,
  ): Details | boolean | string | { [key: string]: unknown } | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return param ? req.useragent?.[param] : req.useragent;
  },
);
