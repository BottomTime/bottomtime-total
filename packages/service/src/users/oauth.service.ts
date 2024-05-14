import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { UserEntity, UserOAuthEntity } from '../data';
import { User } from './user';

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

  async linkOAuthUser(
    userId: string,
    provider: string,
    providerId: string,
  ): Promise<void> {
    const existing = await this.getOAuthUser(provider, providerId);
    if (existing) return;

    const oauth = new UserOAuthEntity();
    oauth.id = uuid();
    oauth.provider = provider;
    oauth.providerId = providerId;
    oauth.user = { id: userId } as UserEntity;

    await this.oauth.save(oauth);
  }

  async unlinkOAuthUser(provider: string, providerId: string): Promise<void> {
    await this.oauth.delete({ provider, providerId });
  }
}
