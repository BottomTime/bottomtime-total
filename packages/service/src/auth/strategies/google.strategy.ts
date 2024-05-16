import { LogBookSharing, UserRole } from '@bottomtime/api';

import { Inject, Injectable } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';

import { Request } from 'express';
import { Profile, Strategy } from 'passport-google-oauth20';

import { Config } from '../../config';
import { CreateLinkedAccountOptions, OAuthService } from '../oauth.service';
import { User } from '../user';
import { generateUsername, verifyOAuth } from './oauth-helpers';

export const Provider = 'google';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}

@Injectable()
export class GoogleLinkGuard extends AuthGuard('google-link') {}

async function verifyGoogleAuth(
  oauth: OAuthService,
  req: Request,
  profile: Profile,
): Promise<User> {
  const currentUser = req.user instanceof User ? req.user : undefined;
  const options: CreateLinkedAccountOptions = {
    provider: Provider,
    providerId: profile.id,
    username: profile.username || generateUsername(Provider),
    avatar: profile.photos?.[0]?.value.trim(),
    email: profile.emails?.[0]?.value,
    role: UserRole.User,
    profile: {
      name: profile.displayName,
      logBookSharing: LogBookSharing.FriendsOnly,
    },
  };

  return await verifyOAuth(oauth, options, currentUser);
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private static readonly Provider = 'google';

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
    return verifyGoogleAuth(this.oauth, req, profile);
  }
}

@Injectable()
export class GoogleLinkStrategy extends PassportStrategy(
  Strategy,
  'google-link',
) {
  private static readonly Provider = 'google';

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
      assignProperty: 'account',
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<User> {
    return verifyGoogleAuth(this.oauth, req, profile);
  }
}
