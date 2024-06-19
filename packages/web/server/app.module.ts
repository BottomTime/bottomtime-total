import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Logger, Module } from '@nestjs/common';

import { ViteDevServer } from 'vite';

import { Config } from './config';
import { DevModule } from './dev';
import { ProductionModule } from './production';

export type ServerDependencies = {
  vite?: ViteDevServer;
};

type Imports = NonNullable<DynamicModule['imports']>;

@Module({})
export class AppModule {
  static forRoot(): DynamicModule {
    const log = new Logger(AppModule.name);
    const imports: Imports = [HttpModule];

    if (Config.isProduction) {
      log.log('Initializing application in production mode...');
      imports.push(ProductionModule);
    } else {
      // For production we are just serving the pre-compiled static assets,
      // so we need to add the ServeStaticModule to handle serving the files.
      log.log('Initializing application in development mode...');
      imports.push(DevModule);
    }

    return {
      module: AppModule,
      imports,
    };
  }
}
