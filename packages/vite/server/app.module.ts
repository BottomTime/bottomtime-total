import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Logger, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ViteDevServer } from 'vite';
import { ViteModule } from './vite';
import { WebModule } from './web';
import { HealthController } from './health.controller';

export type ServerDependencies = {
  vite?: ViteDevServer;
};

type Imports = NonNullable<DynamicModule['imports']>;

@Module({})
export class AppModule {
  static forRoot(deps: ServerDependencies): DynamicModule {
    const log = new Logger(AppModule.name);
    const imports: Imports = [HttpModule, TerminusModule];

    if (deps.vite) {
      // When running in development mode, we'll have an instance of a ViteDevServer to
      // do on-demand rendering.
      log.log('Initializing application in development mode...');
      imports.push(ViteModule.forRoot(deps.vite));
    } else {
      // For production we are just serving the pre-compiled static assets,
      // so we need to add the ServeStaticModule to handle serving the files.
      log.log('Initializing application in production mode...');
      imports.push(WebModule);
    }

    return {
      module: AppModule,
      imports,
      controllers: [HealthController],
    };
  }
}
