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

    this.log.debug('Attempting to extract JWT from request...');
    const jwt = extractJwt(req);

    // Allow users to proceed anonymously. They will be given an opportunity to authenticate.
    if (!jwt) {
      this.log.debug(
        'No JWT found in request. Allowing request to proceed anonymously.',
      );
      return true;
    }

    // If the token is found, allow Passport to validate it.
    this.log.debug('Validating JWT...');
    return super.canActivate(context);
  }
}
