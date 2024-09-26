import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { Profile, Strategy, StrategyOptions } from 'passport-google-oauth20';

import { Config } from '../config';
import { User } from '../user';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly log = new Logger(GoogleStrategy.name);

  constructor() {
    const options: StrategyOptions = {
      callbackURL: new URL('/callback', Config.baseUrl).toString(),
      clientID: Config.google.clientId,
      clientSecret: Config.google.clientSecret,
      passReqToCallback: false,
      scope: 'email',
    };
    super(options);
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): User {
    this.log.debug('Received response from Google.');

    const email = profile.emails?.[0].value;
    if (!email) {
      throw new UnauthorizedException('No email address provided by Google');
    }

    this.log.log(`Authenticated user <${email}>.`);
    return { email, authorizedDomains: [Config.protectedDomain] };
  }
}
