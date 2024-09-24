import { ExtractJwt, JwtFromRequestFunction } from 'passport-jwt';

import { Config } from '../config';

export const extractJwt: JwtFromRequestFunction = ExtractJwt.fromExtractors([
  ExtractJwt.fromAuthHeaderAsBearerToken(),
  (req) => {
    if (req.cookies) return req.cookies[Config.cookieName];
    else return undefined;
  },
]);
