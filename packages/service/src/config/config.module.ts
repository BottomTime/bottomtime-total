import { DynamicModule, Module, Scope } from '@nestjs/common';

import { loadConfig } from './app-config';

export const AppConfigKey = Symbol('AppConfigKey');

export type ConfigModuleOptions = {
  cache?: boolean;
  global?: boolean;
};

@Module({})
export class ConfigModule {
  static forRoot(options?: ConfigModuleOptions): DynamicModule {
    return {
      module: ConfigModule,
      global: options?.global,
      providers: [
        {
          provide: AppConfigKey,
          useFactory: loadConfig,
          scope: options?.cache ? Scope.DEFAULT : Scope.REQUEST,
        },
      ],
      exports: [AppConfigKey],
    };
  }
}
