import { Request, RequestHandler, Response } from 'express';
import { verify } from 'jsonwebtoken';

export type EdgeAuthorizerConfig = {
  /** Whether edge authorization should be enabled. If false, all requests will be allowed. */
  enabled: boolean;

  /** Audience (`aud` claim) to match in the JWT. */
  audience: string;

  /** Name of the cookie in which to look for the JWT. */
  cookieName: string;

  /** The secret key with which the JWT was signed. This is needed for verification. */
  secret: string;
};

const AuthhHeaderRegex = /^Bearer\s+\S+$/i;

function extractJwt(req: Request, cookieName?: string): string | undefined {
  if (
    req.headers.authorization &&
    AuthhHeaderRegex.test(req.headers.authorization)
  ) {
    return req.headers.authorization.substring(7).trim();
  }

  if (cookieName && req.cookies && req.cookies[cookieName]) {
    return req.cookies[cookieName];
  }

  return undefined;
}

function verifyJwt(
  jwt: string,
  secret: string,
  audience: string,
): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    verify(jwt, secret, { audience }, (error, payload) => {
      if (error) reject(error);
      else resolve(!!payload);
    });
  });
}

function rejectRequest(req: Request, res: Response, message: string): void {
  res.status(401).send({
    status: 401,
    message: `Edge authorization failed. ${message}`,
    method: req.method,
    path: req.path,
  });
}

export function edgeAuthorizer(config: EdgeAuthorizerConfig): RequestHandler {
  return async (req, res, next): Promise<void> => {
    if (!config.enabled) return next();

    const jwt = extractJwt(req, config.cookieName);
    if (!jwt) {
      return rejectRequest(
        req,
        res,
        'This is a protected environment and the expected authorization token was not provided.',
      );
    }

    try {
      const isValid = await verifyJwt(jwt, config.secret, config.audience);
      if (isValid) return next();

      rejectRequest(
        req,
        res,
        'This is a protected environment and the provided authorization token is invalid.',
      );
    } catch (error) {
      next(error);
    }
  };
}
