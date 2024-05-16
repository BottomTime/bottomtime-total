import { UserRole } from '@bottomtime/api';

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { Request } from 'express';
import { Observable } from 'rxjs';

import { User } from '../user';
import { AssertAuth } from './assert-auth.guard';

@Injectable()
export class AssertAdmin implements CanActivate {
  private readonly assertAuth = new AssertAuth();

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // First, assert that the user is logged in and that their account is not suspended.
    this.assertAuth.canActivate(context);

    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as unknown as User;

    if (user.role !== UserRole.Admin) {
      throw new ForbiddenException(
        'You must be logged in as an administrator to perform this action.',
      );
    }

    return true;
  }
}
