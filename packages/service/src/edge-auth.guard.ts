import { CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

import { Request } from 'express';
import { JwtPayload, verify } from 'jsonwebtoken';
import { Observable } from 'rxjs';

import { Config } from './config';

const HeaderName = 'x-bt-auth';

export class EdgeAuthGuard implements CanActivate {
  private readonly log = new Logger(EdgeAuthGuard.name);

  private findJwt(req: Request): string | undefined {
    this.log.debug(
      `Looking for edge authorization token in header: "${HeaderName}"...`,
    );
    if (req.headers && req.headers[HeaderName]) {
      return typeof req.headers[HeaderName] === 'string'
        ? req.headers[HeaderName]
        : req.headers[HeaderName][0];
    }

    this.log.debug(
      `Looking for edge authorization token in cookie: "${Config.edgeAuth.cookieName}"...`,
    );
    if (req.cookies && req.cookies[Config.edgeAuth.cookieName])
      return req.cookies[Config.edgeAuth.cookieName];

    return undefined;
  }

  private verifyJwt(jwt: string): string | undefined {
    this.log.debug('Received edge authorization JWT. Verifying...');
    const payload = verify(jwt, Config.edgeAuth.sessionSecret, {
      audience: Config.edgeAuth.audience,
    }) as JwtPayload;

    return payload.sub;
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (!Config.edgeAuth.enabled) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const jwt = this.findJwt(req);
    if (!jwt) {
      throw new UnauthorizedException(
        'This is a protected environment and an authorization token is expected with each request.',
      );
    }

    const subject = this.verifyJwt(jwt);
    if (subject) {
      this.log.log(`Edge authorization succeeded: ${subject}`);
      return true;
    }

    throw new ForbiddenException('Provided edge authorization JWT is invalid.');
  }
}
