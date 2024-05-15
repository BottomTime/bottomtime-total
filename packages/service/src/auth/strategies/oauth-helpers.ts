import { UnauthorizedException } from '@nestjs/common';

import { randomBytes } from 'crypto';

import { User } from '../../users';
import { CreateLinkedAccountOptions, OAuthService } from '../oauth.service';

export function generateUsername(provider: string): string {
  const suffix = randomBytes(6).toString('base64url');
  return `${provider}_${suffix}`;
}

async function verifyOAuthForAuthenticatedUser(
  currentUser: User,
  oauthUser?: User,
): Promise<User> {
  if (oauthUser) {
    if (currentUser.id === oauthUser.id) {
      return currentUser;
    } else {
      throw new UnauthorizedException(
        'This federated account is already linked to another user account. Please log out and log into that account instead.',
      );
    }
  }
  return currentUser;
}

async function verifyOAuthForUnauthenticatedUser(
  oauth: OAuthService,
  profileOptions: CreateLinkedAccountOptions,
  oauthUser?: User,
): Promise<User> {
  if (oauthUser) return oauthUser;

  if (await oauth.isUsernameTaken(profileOptions.username)) {
    profileOptions.username = generateUsername(profileOptions.provider);
  }

  if (
    profileOptions.email &&
    (await oauth.isEmailTaken(profileOptions.email))
  ) {
    profileOptions.email = undefined;
  }

  return await oauth.createAccountWithOAuthLink(profileOptions);
}

export async function verifyOAuth(
  oauth: OAuthService,
  profileOptions: CreateLinkedAccountOptions,
  currentUser?: User,
): Promise<User> {
  const oauthUser = await oauth.getOAuthUser(
    profileOptions.provider,
    profileOptions.providerId,
  );

  return currentUser
    ? await verifyOAuthForAuthenticatedUser(currentUser, oauthUser)
    : await verifyOAuthForUnauthenticatedUser(oauth, profileOptions, oauthUser);
}
