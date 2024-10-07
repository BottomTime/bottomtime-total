import jwt from 'jsonwebtoken';

import { getLogger } from './logger.mjs';

const log = getLogger();
const AuthHeaderName = 'x-bt-auth';

function extractJwt(req, cookieName) {
  log.debug(`Looking for edge auth header: ${AuthHeaderName}`);
  if (req.headers[AuthHeaderName]) {
    log.debug('Found edge auth header');
    log.trace('Headers:', req.headers);
    return req.headers[AuthHeaderName].trim();
  }

  if (cookieName) {
    log.debug(`Looking for edge auth cookie: ${cookieName}`);
    log.trace('Cookies:', req.cookies);
    if (req.cookies && req.cookies[cookieName]) {
      log.debug('Found edge auth cookie');
      return req.cookies[cookieName];
    }
  }

  return undefined;
}

function verifyJwt(jwtString, secret, audience) {
  return new Promise((resolve, reject) => {
    jwt.verify(jwtString, secret, { audience }, (error, payload) => {
      if (error) reject(error);
      else resolve(!!payload);
    });
  });
}

function rejectRequest(req, res, message) {
  res.status(401).send({
    status: 401,
    message: `Edge authorization failed. ${message}`,
    method: req.method,
    path: req.path,
  });
}

export function edgeAuthorizer(config) {
  return async (req, res, next) => {
    log.debug(
      `Extracting edge auth JWT from request... Audience: ${config.audience}`,
    );
    const jwt = extractJwt(req, config.cookieName);
    if (!jwt) {
      return rejectRequest(
        req,
        res,
        'This is a protected environment and the expected authorization token was not provided.',
      );
    }

    try {
      log.debug('Verifying edge auth JWT...');
      const isValid = await verifyJwt(jwt, config.secret, config.audience);
      if (isValid) return next();

      rejectRequest(
        req,
        res,
        'This is a protected environment and the provided authorization token is invalid.',
      );
    } catch (error) {
      log.error(error);
      rejectRequest(
        req,
        res,
        'JWT verification failed. There was a problem with the token provided.',
      );
    }
  };
}
