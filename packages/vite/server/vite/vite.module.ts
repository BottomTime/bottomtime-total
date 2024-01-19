import { DynamicModule, Module } from '@nestjs/common';
import { ViteService } from './vite.service';
import { ViteDevServer } from 'vite';
import { ViteServer } from './constants';

@Module({})
export class ViteModule {
  private static vite: ViteDevServer | undefined;
  private static readonly moduleDef: Partial<DynamicModule> = {
    providers: [
      ViteService,
      {
        provide: ViteServer,
        useFactory: () => ViteModule.vite,
      },
    ],
    exports: [ViteService],
  };

  static forRoot(vite?: ViteDevServer): DynamicModule {
    ViteModule.vite = vite;
    return {
      module: ViteModule,
      ...ViteModule.moduleDef,
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: ViteModule,
      ...ViteModule.moduleDef,
    };
  }
}
