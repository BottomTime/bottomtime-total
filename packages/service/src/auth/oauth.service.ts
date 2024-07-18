import { CreateUserParamsDTO } from '@bottomtime/api';

import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { UserEntity, UserOAuthEntity } from '../data';
import { User, UserFactory, UsersService } from '../users';

export type OAuthAccount = {
  provider: string;
  providerId: string;
};

export type CreateLinkedAccountOptions = CreateUserParamsDTO & {
  provider: string;
  providerId: string;
};

@Injectable()
export class OAuthService {
  constructor(
    @Inject(UsersService) private readonly users: UsersService,
    @Inject(UserFactory) private readonly userFactory: UserFactory,
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
      return this.userFactory.createUser(result.user);
    }

    return undefined;
  }

  async listLinkedOAuthAccounts(username: string): Promise<OAuthAccount[]> {
    const accounts = await this.oauth.find({
      where: { user: { usernameLowered: username.trim().toLowerCase() } },
      select: { provider: true, providerId: true },
      order: { provider: 'ASC' },
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
    const conflict = await this.oauth.existsBy([
      { provider, providerId },
      { user: { id: userId }, provider },
    ]);
    if (conflict) {
      throw new ConflictException(
        `OAuth provider "${provider}" with ID "${providerId}" is already linked to a user account or your account already has an existing link to the provider.`,
      );
    }

    const oauth = new UserOAuthEntity();
    oauth.id = uuid();
    oauth.provider = provider;
    oauth.providerId = providerId;
    oauth.user = { id: userId } as UserEntity;

    await this.oauth.save(oauth);
  }

  async unlinkOAuthUser(username: string, provider: string): Promise<boolean> {
    const user = await this.users.getUserByUsernameOrEmail(username);
    if (!user) return false;

    const { affected } = await this.oauth.delete({
      provider,
      user: { id: user.id },
    });
    return typeof affected === 'number' && affected > 0;
  }

  async isUsernameTaken(username: string): Promise<boolean> {
    return await this.users.isUsernameTaken(username);
  }

  async isEmailTaken(email: string): Promise<boolean> {
    return await this.users.isEmailTaken(email);
  }

  async createAccountWithOAuthLink(
    options: CreateLinkedAccountOptions,
  ): Promise<User> {
    const oauthLink = new UserOAuthEntity();

    const user = await this.users.createUser(options);

    oauthLink.id = uuid();
    oauthLink.provider = options.provider;
    oauthLink.providerId = options.providerId;
    oauthLink.user = user.toEntity();

    await this.oauth.save(oauthLink);
    return user;
  }
}
