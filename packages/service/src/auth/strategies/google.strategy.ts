import { LogBookSharing, UserRole } from '@bottomtime/api';

import { Inject, Injectable } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';

import { Request } from 'express';
import { Profile, Strategy } from 'passport-google-oauth20';

import { Config } from '../../config';
import { User } from '../../users';
import { CreateLinkedAccountOptions, OAuthService } from '../oauth.service';
import { generateUsername, verifyOAuth } from './oauth-helpers';

export const Provider = 'google';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(@Inject(OAuthService) private readonly oauth: OAuthService) {
    super({
      clientID: Config.google.clientId,
      clientSecret: Config.google.clientSecret,
      callbackURL: new URL(
        '/api/auth/google/callback',
        Config.baseUrl,
      ).toString(),
      scope: ['profile', 'email'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<User> {
    const currentUser = req.user instanceof User ? req.user : undefined;
    const options: CreateLinkedAccountOptions = {
      provider: Provider,
      providerId: profile.id,
      username: profile.username || generateUsername(Provider),
      email: profile.emails?.[0]?.value,
      role: UserRole.User,
      profile: {
        avatar: profile.photos?.[0]?.value.trim(),
        name: profile.displayName,
        logBookSharing: LogBookSharing.FriendsOnly,
      },
    };

    return await verifyOAuth(this.oauth, options, currentUser);
  }
}
