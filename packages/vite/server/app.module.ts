import { DynamicModule, Module } from '@nestjs/common';
import { WebModule } from './web';
import { ViteDevServer } from 'vite';
import { ViteModule } from './vite';

export type ServerDependencies = {
  vite?: ViteDevServer;
};

@Module({})
export class AppModule {
  static forRoot(deps: ServerDependencies): DynamicModule {
    return {
      module: AppModule,
      imports: [WebModule, ViteModule.forRoot(deps.vite), WebModule],
    };
  }
}
