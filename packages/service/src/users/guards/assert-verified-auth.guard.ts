import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Request } from 'express';

import { User } from '../user';

@Injectable()
export class AssertVerifiedAuth implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user instanceof User ? req.user : undefined;

    if (!user) {
      throw new UnauthorizedException(
        'You must be logged in to perform this action.',
      );
    }

    if (!user.emailVerified) {
      throw new ForbiddenException(
        'Your email address has not been verified. You may not perform this action until your address has been verified.',
      );
    }

    return true;
  }
}
