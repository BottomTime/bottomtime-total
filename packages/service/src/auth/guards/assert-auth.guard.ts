import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { User } from '../../users/user';

@Injectable()
export class AssertAuth implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    if (!(req.user instanceof User)) {
      throw new UnauthorizedException(
        'You must be logged in to take this action.',
      );
    }

    // Check that the user's account is not suspended. Invalidating JWTs is hard so it's possible a user
    // presents a JWT that's technically valid even though the account has subsequently been locked.
    const user = req.user as unknown as User;
    if (user.isLockedOut) {
      throw new ForbiddenException(
        'Your account is currently suspended. You are not permitted to perform this action.',
      );
    }

    return true;
  }
}
