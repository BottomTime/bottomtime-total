import { DynamicModule, Module } from '@nestjs/common';
import { ViteService } from './vite.service';
import { ViteDevServer } from 'vite';
import { ViteServer } from './constants';
import { ViteController } from './vite.controller';
import { JwtModule } from '../jwt';

@Module({})
export class ViteModule {
  private static vite: ViteDevServer | undefined;
  private static readonly moduleDef: Partial<DynamicModule> = {
    imports: [JwtModule],
    providers: [
      ViteService,
      {
        provide: ViteServer,
        useFactory: () => ViteModule.vite,
      },
    ],
    controllers: [ViteController],
    exports: [ViteService],
  };

  static forRoot(vite: ViteDevServer): DynamicModule {
    ViteModule.vite = vite;
    return {
      module: ViteModule,
      ...ViteModule.moduleDef,
    };
  }

  static forFeature(): DynamicModule {
    if (!ViteModule.vite) {
      throw new Error('ViteModule must be initialized with forRoot() first.');
    }

    return {
      module: ViteModule,
      ...ViteModule.moduleDef,
    };
  }
}
