import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

import Logger from 'bunyan';
import { Request, RequestHandler } from 'express';
import { JwtPayload, verify } from 'jsonwebtoken';

import { Config } from './config';

type EdgeAuthConfig = (typeof Config)['edgeAuth'];
const HeaderName = 'x-bt-auth';

function findJwt(
  req: Request,
  cookie: string,
  log: Logger,
): string | undefined {
  log.debug(
    `Looking for edge authorization token in header: "${HeaderName}"...`,
  );
  if (req.headers && req.headers[HeaderName]) {
    return typeof req.headers[HeaderName] === 'string'
      ? req.headers[HeaderName]
      : req.headers[HeaderName][0];
  }

  log.debug(`Looking for edge authorization token in cookie: "${cookie}"...`);
  if (req.cookies && req.cookies[cookie]) return req.cookies[cookie];

  return undefined;
}

function verifyJwt(
  jwt: string,
  config: EdgeAuthConfig,
  log: Logger,
): string | undefined {
  log.debug('Received edge authorization JWT. Verifying...');
  const payload = verify(jwt, config.sessionSecret, {
    audience: config.audience,
  }) as JwtPayload;

  return payload.sub;
}

export function edgeAuth(config: EdgeAuthConfig, log: Logger): RequestHandler {
  return (req, _res, next) => {
    if (!config.enabled) return next();

    const jwt = findJwt(req, config.cookieName, log);

    if (!jwt) {
      return next(
        new UnauthorizedException(
          'This is a protected environment and an authorization token is expected with each request.',
        ),
      );
    }

    try {
      const subject = verifyJwt(jwt, config, log);

      if (subject) {
        log.info(`Edge authorization succeeded: ${subject}`);
        return next();
      }

      return next(
        new ForbiddenException('Provided edge authorization JWT is invalid.'),
      );
    } catch (error) {
      next(error);
    }
  };
}
