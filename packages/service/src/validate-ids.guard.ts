import {
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';

import { Request } from 'express';
import { z } from 'zod';

const UuidValidator = z.string().uuid();

class ValidateIdsGuard implements CanActivate {
  private readonly params: string[];

  constructor(params: string | string[]) {
    this.params = typeof params === 'string' ? [params] : params;
  }

  canActivate(context: ExecutionContext): boolean {
    const routeParams = context.switchToHttp().getRequest<Request>().params;

    this.params.forEach((param) => {
      const validation = UuidValidator.safeParse(routeParams[param]);
      if (!validation.success) {
        throw new NotFoundException(
          `Resource not found: ${routeParams[param]}`,
        );
      }
    });

    return true;
  }
}

export function ValidateIds(params: string | string[]): ValidateIdsGuard {
  return new ValidateIdsGuard(params);
}
