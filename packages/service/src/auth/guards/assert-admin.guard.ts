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
import { UserRole } from '@bottomtime/api';

const ErrorMessage =
  'You must be logged in as an administrator to perform this action.';

@Injectable()
export class AssertAdmin implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    if (!req.user) {
      throw new UnauthorizedException(ErrorMessage);
    }

    const user = req.user as unknown as User;
    if (user.role !== UserRole.Admin) {
      throw new ForbiddenException(ErrorMessage);
    }

    return true;
  }
}
