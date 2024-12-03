import { Logger, Module } from '@nestjs/common';

import { RedisClientType, createClient } from 'redis';

import { Config } from '../config';

export const RedisClient = Symbol('RedisClient');

@Module({
  providers: [
    {
      provide: RedisClient,
      useFactory: async (): Promise<RedisClientType> => {
        const log = new Logger(RedisModule.name);
        log.debug(
          `Creating Redis client with connection string: ${Config.redisUri}...`,
        );
        return await createClient({
          url: Config.redisUri,
        });
      },
    },
  ],
  exports: [RedisClient],
})
export class RedisModule {}
