import { Logger, Module } from '@nestjs/common';

import { PollingMode, getClient } from 'configcat-node';

import { Config } from '../config';

export const ConfigCatClient = Symbol('ConfigCatClient');

@Module({
  providers: [
    {
      provide: ConfigCatClient,
      useFactory() {
        return getClient(Config.configCatSdkKey, PollingMode.AutoPoll, {
          logger: new Logger(ConfigCatModule.name),
        });
      },
    },
  ],
  exports: [ConfigCatClient],
})
export class ConfigCatModule {}
