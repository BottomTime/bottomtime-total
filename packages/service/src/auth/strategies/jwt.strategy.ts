import { ExecutionContext, Inject, Injectable, Logger } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';

import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { Strategy } from 'passport-jwt';
import { Observable } from 'rxjs';

import { Config } from '../../config';
import { User } from '../../users';
import { AuthService } from '../auth.service';
import { extractJwtFromRequest } from '../extract-jwt';

@Injectable()
export class JwtOrAnonAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const jwt = extractJwtFromRequest(req);

    // If there's no JWT in the request, allow the request to proceed as an anonymous user.
    if (!jwt) return true;

    // Otherwise, if the JWT is present, allow Passport.js to validate it and authenticate the user.
    return super.canActivate(context);
  }
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly log = new Logger(JwtStrategy.name);

  constructor(@Inject(AuthService) private readonly authService: AuthService) {
    super({
      jwtFromRequest: extractJwtFromRequest,
      ignoreExpiration: false,
      // issuer: Config.baseUrl,
      secretOrKey: Config.sessions.sessionSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    return await this.authService.validateJwt(payload);
  }
}
