import { DynamicModule, Module } from '@nestjs/common';

import { ViteDevServer } from 'vite';

import { JwtModule } from '../jwt';
import { ViteServer } from './constants';
import { DevController } from './dev.controller';
import { DevService } from './dev.service';

@Module({
  imports: [JwtModule],
  providers: [DevService],
  controllers: [DevController],
})
export class DevModule {}
