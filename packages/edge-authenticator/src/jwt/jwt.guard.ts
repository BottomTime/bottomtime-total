import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Observable } from 'rxjs';

import { extractJwt } from './extract-jwt';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly log = new Logger(JwtAuthGuard.name);

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    const jwt = extractJwt(req);

    // Allow users to proceed anonymously. They will be given an opportunity to authenticate.
    if (!jwt) return true;

    // If the token is found, allow Passport to validate it.
    return super.canActivate(context);
  }
}
