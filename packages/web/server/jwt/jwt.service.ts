import { Injectable, Logger } from '@nestjs/common';

import { Request } from 'express';

import { Config } from '../config';

const BearerTokenHeaderRegex = /^bearer\s+\S+$/i;

@Injectable()
export class JwtService {
  private readonly log: Logger = new Logger(JwtService.name);

  private static parseAuthHeader(header: string): string | undefined {
    if (!BearerTokenHeaderRegex.test(header)) return undefined;

    const [, token] = header.split(/\s+/);
    return token;
  }

  extractJwtFromRequest(req: Request): string | undefined {
    let token: string | undefined;

    // First look for the JWT in the Authorization header.
    if (req.headers.authorization) {
      token = JwtService.parseAuthHeader(req.headers.authorization);
      if (token) {
        this.log.debug('Found Bearer token in Authorization header.');
        return token;
      }
    }

    // If not found, look for a session cookie.
    token = req.cookies[Config.cookieName];
    if (token) {
      this.log.debug('Found Bearer token in session cookie.');
      return token;
    }

    this.log.debug('No Bearer token found.');
    return token;
  }
}
