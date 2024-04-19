import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';

import { Observable } from 'rxjs';

import { User } from '../../users';
import { AssertAuth } from './assert-auth.guard';

@Injectable()
export class AssertVerifiedAuth implements CanActivate {
  constructor(@Inject(AssertAuth) private readonly assertAuth: CanActivate) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (!this.assertAuth.canActivate(context)) {
      return false;
    }

    const req = context.switchToHttp().getRequest();
    const user: User = req.user;
    if (!user.emailVerified) {
      throw new ForbiddenException(
        'Your email address has not been verified. You may not perform this action until your address has been verified.',
      );
    }

    return true;
  }
}
