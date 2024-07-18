import { LogBookSharing, UserRole } from '@bottomtime/api';

import { Inject, Injectable } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';

import { Request } from 'express';
import { Profile, Strategy } from 'passport-discord';
import { URL } from 'url';

import { Config } from '../../config';
import { User } from '../../users';
import { CreateLinkedAccountOptions, OAuthService } from '../oauth.service';
import { generateUsername, verifyOAuth } from './oauth-helpers';

export const Provider = 'discord';

@Injectable()
export class DiscordAuthGuard extends AuthGuard('discord') {}

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor(@Inject(OAuthService) private readonly oauth: OAuthService) {
    super({
      clientID: Config.discord.clientId,
      clientSecret: Config.discord.clientSecret,
      callbackURL: new URL(
        '/api/auth/discord/callback',
        Config.baseUrl,
      ).toString(),
      scope: ['identify', 'email'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ) {
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
