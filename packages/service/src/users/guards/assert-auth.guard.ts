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
export class AssertAuth implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user instanceof User ? req.user : undefined;
    if (!user) {
      throw new UnauthorizedException(
        'You must be logged in to take this action.',
      );
    }

    // Check that the user's account is not suspended. Invalidating JWTs is hard so it's possible a user
    // presents a JWT that's technically valid even though the account has subsequently been locked.
    if (user.isLockedOut) {
      throw new ForbiddenException(
        'Your account is currently suspended. You are not permitted to perform this action.',
      );
    }

    return true;
  }
}
