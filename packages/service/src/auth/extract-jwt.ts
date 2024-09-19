import { Request } from 'express';
import { ExtractJwt, JwtFromRequestFunction } from 'passport-jwt';

import { Config } from '../config';

let extract: JwtFromRequestFunction;

export function extractJwtFromRequest(req: Request): string | null {
  if (!extract) {
    extract = ExtractJwt.fromExtractors([
      ExtractJwt.fromAuthHeaderAsBearerToken(),
      (req) => {
        if (req.cookies) return req.cookies[Config.sessions.cookieName];
        else return undefined;
      },
    ]);
  }

  return extract(req);
}
