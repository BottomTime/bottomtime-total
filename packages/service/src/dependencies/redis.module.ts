import {
  CacheModuleOptions,
  CacheOptionsFactory,
  CacheStore,
} from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, Module } from '@nestjs/common';

import { RedisClientType, createClient } from 'redis';

import { Config } from '../config';

export const RedisClient = Symbol('RedisClient');

const TenMinutesInMs = 1000 * 60 * 10;

class RedisCacheStore implements CacheStore {
  private readonly log = new Logger(RedisCacheStore.name);

  constructor(private readonly redis: RedisClientType) {}

  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.redis.get(key);
    if (value === null) return undefined;

    this.log.debug(`Cache hit for key "${key}"`);
    return JSON.parse(value);
  }

  async set<T>(
    key: string,
    value: T,
    options?: { ttl: number },
  ): Promise<void> {
    this.log.debug(`Writing cache key "${key}"...`);
    await this.redis.set(key, JSON.stringify(value), {
      EX: options?.ttl ?? TenMinutesInMs,
    });
  }

  async del(key: string): Promise<void> {
    this.log.debug(`Deleting cache key "${key}"`);
    await this.redis.del(key);
  }
}

@Injectable()
export class RedisCacheConfigService implements CacheOptionsFactory {
  constructor(@Inject(RedisClient) private readonly redis: RedisClientType) {}

  createCacheOptions(): CacheModuleOptions {
    return {
      store: new RedisCacheStore(this.redis),
      ttl: TenMinutesInMs,
    };
  }
}

@Module({
  providers: [
    {
      provide: RedisClient,
      useFactory: async (): Promise<RedisClientType> => {
        const log = new Logger(RedisModule.name);
        log.debug('Creating new Redis client...');
        const client = await createClient({
          url: Config.redisUri,
        });
        await client.connect();
        return client as RedisClientType;
      },
    },
    RedisCacheConfigService,
  ],
  exports: [RedisClient, RedisCacheConfigService],
})
export class RedisModule {}
