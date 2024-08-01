import { Injectable, Logger } from '@nestjs/common';

import { User as ConfigCatUser, IConfigCatClient } from 'configcat-node';

import { User } from '../users';
import { Feature } from './features';

@Injectable()
export class FeaturesService {
  private readonly log = new Logger(FeaturesService.name);

  constructor(private readonly client: IConfigCatClient) {}

  async getFeature<T extends boolean | string | number>(
    feature: Feature<T>,
    user?: User,
  ): Promise<T> {
    const configCatUser = user
      ? new ConfigCatUser(user.id, user.email ?? undefined)
      : undefined;
    const value = await this.client.getValueAsync<T>(
      feature.key,
      feature.defaultValue,
      configCatUser,
    );

    return value as T;
  }
}
