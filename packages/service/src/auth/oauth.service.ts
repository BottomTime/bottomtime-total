import {
  CreateUserParamsDTO,
  DepthUnit,
  LogBookSharing,
  PressureUnit,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { hash } from 'bcrypt';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { Config } from '../config';
import { UserEntity, UserOAuthEntity } from '../data';
import { User } from '../users/user';

export type OAuthAccount = {
  provider: string;
  providerId: string;
};

export type CreateLinkedAccountOptions = CreateUserParamsDTO & {
  provider: string;
  providerId: string;
  avatar?: string;
};

@Injectable()
export class OAuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(UserOAuthEntity)
    private readonly oauth: Repository<UserOAuthEntity>,
  ) {}

  async getOAuthUser(
    provider: string,
    providerId: string,
  ): Promise<User | undefined> {
    const result = await this.oauth.findOne({
      where: { provider, providerId },
      relations: ['user'],
    });

    if (result) {
      return new User(this.users, result.user);
    }

    return undefined;
  }

  async listLinkedOAuthAccounts(userId: string): Promise<OAuthAccount[]> {
    const accounts = await this.oauth.find({
      where: { user: { id: userId } },
      order: { provider: 'ASC' },
      select: ['provider', 'providerId'],
    });

    return accounts.map((account) => ({
      provider: account.provider,
      providerId: account.providerId,
    }));
  }

  async linkOAuthUser(
    userId: string,
    provider: string,
    providerId: string,
  ): Promise<void> {
    const existing = await this.getOAuthUser(provider, providerId);
    if (existing) {
      throw new ConflictException(
        `OAuth provider "${provider}" with ID "${providerId}" is already linked to a user account.`,
      );
    }

    const oauth = new UserOAuthEntity();
    oauth.id = uuid();
    oauth.provider = provider;
    oauth.providerId = providerId;
    oauth.user = { id: userId } as UserEntity;

    await this.oauth.save(oauth);
  }

  async unlinkOAuthUser(
    userId: string,
    provider: string,
    providerId: string,
  ): Promise<void> {
    await this.oauth.delete({ provider, providerId, user: { id: userId } });
  }

  async isUsernameTaken(username: string): Promise<boolean> {
    return await this.users.existsBy({
      usernameLowered: username.toLowerCase(),
    });
  }

  async isEmailTaken(email: string): Promise<boolean> {
    return await this.users.existsBy({
      emailLowered: email.toLowerCase(),
    });
  }

  async createAccountWithOAuthLink(
    options: CreateLinkedAccountOptions,
  ): Promise<User> {
    const user = new UserEntity();
    const oauthLink = new UserOAuthEntity();

    user.id = uuid();
    user.avatar = options.avatar ?? null;
    user.bio = options.profile?.bio ?? null;
    user.depthUnit = options.settings?.depthUnit ?? DepthUnit.Meters;
    user.email = options.email ?? null;
    user.emailLowered = options.email?.toLowerCase() ?? null;
    user.emailVerified = false;
    user.experienceLevel = options.profile?.experienceLevel ?? null;
    user.isLockedOut = false;
    user.location = options.profile?.location ?? null;
    user.logBookSharing =
      options.profile?.logBookSharing ?? LogBookSharing.Private;
    user.memberSince = new Date();
    user.name = options.profile?.name ?? null;
    user.passwordHash = options.password
      ? await hash(options.password, Config.passwordSaltRounds)
      : null;
    user.pressureUnit = options.settings?.pressureUnit ?? PressureUnit.Bar;
    user.role = options.role ?? UserRole.User;
    user.startedDiving = options.profile?.startedDiving ?? null;
    user.temperatureUnit =
      options.settings?.temperatureUnit ?? TemperatureUnit.Celsius;
    user.username = options.username;
    user.usernameLowered = options.username.toLowerCase();
    user.weightUnit = options.settings?.weightUnit ?? WeightUnit.Kilograms;

    oauthLink.id = uuid();
    oauthLink.provider = options.provider;
    oauthLink.providerId = options.providerId;
    oauthLink.user = user;

    await this.users.save(user);
    await this.oauth.save(oauthLink);

    return new User(this.users, user);
  }
}
