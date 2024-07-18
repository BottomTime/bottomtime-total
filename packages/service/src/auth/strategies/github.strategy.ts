import { LogBookSharing, UserRole } from '@bottomtime/api';

import { Inject, Injectable } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';

import { Request } from 'express';
import { Profile, Strategy } from 'passport-github2';
import { URL } from 'url';

import { Config } from '../../config';
import { User } from '../../users';
import { CreateLinkedAccountOptions, OAuthService } from '../oauth.service';
import { generateUsername, verifyOAuth } from './oauth-helpers';

export const Provider = 'github';

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(@Inject(OAuthService) private readonly oauth: OAuthService) {
    super({
      clientID: Config.github.clientId,
      clientSecret: Config.github.clientSecret,
      callbackURL: new URL(
        '/api/auth/github/callback',
        Config.baseUrl,
      ).toString(),
      scope: ['user:email'],
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
