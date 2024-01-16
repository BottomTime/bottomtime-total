import { Strategy } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Config } from '../../config';
import { User } from '../../users/user';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: Config.google.clientId,
      clientSecret: Config.google.clientSecret,
      callbackURL: new URL('/api/auth/google/callback', Config.baseUrl),
      scope: ['profile', 'email'],
    });
  }

  async validate(): Promise<User> {
    throw new Error('nope');
  }
}
