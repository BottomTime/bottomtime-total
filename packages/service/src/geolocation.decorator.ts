import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { Request } from 'express';

import { GeolocationData } from './types/geolocation';

export const Geolocation = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): GeolocationData | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.geolocation;
  },
);
